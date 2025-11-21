import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { db } from "../firebase.js";
import "./ExtratoFinanceiro.css";

const PLANOS = {
  3: { label: "3 dias", valor: 40 },
  5: { label: "5 dias", valor: 50 },
};

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(valor);

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const ExtratoFinanceiro = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [competencia, setCompetencia] = useState(() => {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    return `${hoje.getFullYear()}-${mes}`;
  });

  const loadClientes = async () => {
    setLoading(true);
    try {
      const clientesRef = collection(db, "clientes");
      const snapshot = await getDocs(clientesRef);
      const data = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));
      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      alert("Não foi possível carregar os clientes. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const competenciaDate = useMemo(() => {
    const [year, month] = competencia.split("-").map(Number);
    if (!year || !month) return new Date();
    return new Date(year, month - 1, 1);
  }, [competencia]);

  const competenciaLabel = useMemo(() => {
    const formatted = competenciaDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    return capitalize(formatted);
  }, [competenciaDate]);

  const totalMensal = useMemo(() => {
    return clientes.reduce((acc, cliente) => {
      const planoValor = PLANOS[cliente.plano]?.valor || 0;
      return acc + planoValor;
    }, 0);
  }, [clientes]);

  const handlePlanoChange = async (clienteId, novoPlano) => {
    const planoNumero = Number(novoPlano);
    if (![3, 5].includes(planoNumero)) return;

    setUpdatingId(clienteId);
    try {
      const clienteRef = doc(db, "clientes", clienteId);
      await updateDoc(clienteRef, { plano: planoNumero });
      setClientes((prev) =>
        prev.map((cliente) =>
          cliente.id === clienteId ? { ...cliente, plano: planoNumero } : cliente
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      alert("Não foi possível atualizar o plano. Tente novamente.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="extrato-container">
      <header className="extrato-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <span
            className="material-symbols-rounded"
            style={{ fontVariationSettings: '"wght" 300' }}
          >
            arrow_back
          </span>
        </button>
        <div className="extrato-header-text">
          <h1>Extrato Financeiro</h1>
          <p>Resumo das mensalidades por cliente</p>
        </div>
        <button className="icon-btn" onClick={loadClientes} disabled={loading}>
          <span
            className="material-symbols-rounded"
            style={{ fontVariationSettings: '"wght" 300' }}
          >
            refresh
          </span>
        </button>
      </header>

      <section className="extrato-filter">
        <div className="extrato-filter-header">
          <div>
            <p className="extrato-label">Mês de referência</p>
            <strong>{competenciaLabel}</strong>
          </div>
          <div className="extrato-filter-control">
            <span
              className="material-symbols-rounded"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              calendar_month
            </span>
            <input
              type="month"
              id="competencia"
              value={competencia}
              onChange={(event) => setCompetencia(event.target.value)}
            />
          </div>
        </div>
        <p className="extrato-filter-hint">
          Escolha o mês para visualizar o total esperado.
        </p>
      </section>

      <section className="extrato-list">
        {loading ? (
          <div className="extrato-state">Carregando clientes...</div>
        ) : clientes.length === 0 ? (
          <div className="extrato-state">Nenhum cliente cadastrado.</div>
        ) : (
          clientes.map((cliente) => {
            const nomeCompleto = `${cliente.nome}${
              cliente.sobrenome ? ` ${cliente.sobrenome}` : ""
            }`;
            const planoSelecionado =
              cliente.plano === 3 || cliente.plano === 5
                ? cliente.plano.toString()
                : "";
            const mensalidade = PLANOS[cliente.plano]?.valor || 0;

            return (
              <article key={cliente.id} className="extrato-card">
                <div className="extrato-card-header">
                  <div>
                    <p className="extrato-label">Nome do Cliente</p>
                    <h2>{nomeCompleto}</h2>
                  </div>
                  <div className="extrato-mensalidade">
                    <p className="extrato-label">Mensalidade</p>
                    <strong>{formatCurrency(mensalidade)}</strong>
                  </div>
                </div>

                <div className="extrato-card-body">
                  <div className="extrato-plano">
                    <p className="extrato-label">Plano</p>
                    <select
                      value={planoSelecionado}
                      className="extrato-select"
                      onChange={(event) =>
                        handlePlanoChange(cliente.id, event.target.value)
                      }
                      disabled={updatingId === cliente.id}
                    >
                      <option value="">Selecione</option>
                      <option value="3">3 dias por semana</option>
                      <option value="5">5 dias por semana</option>
                    </select>
                  </div>
                  <p className="extrato-plano-descricao">
                    {planoSelecionado
                      ? `Plano ${PLANOS[cliente.plano]?.label}`
                      : "Defina o plano para calcular a mensalidade."}
                  </p>
                </div>
              </article>
            );
          })
        )}
      </section>

      <div className="extrato-total-card">
        <span>TOTAL DO MÊS · {competenciaLabel}</span>
        <strong>{formatCurrency(totalMensal)}</strong>
      </div>

      <BottomNav />
    </div>
  );
};

export default ExtratoFinanceiro;

