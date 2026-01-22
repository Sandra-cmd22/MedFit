import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import ModalAcoesCliente from "../components/ModalAcoesCliente.jsx";
import "./Clientes.css";

// Firebase
import { collection, deleteDoc, doc, getDocs, updateDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase.js";
import { calcularSituacao, buscarUltimoPagamento } from "../utils/pagamento.js";

const Clientes = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  // 🔹 Busca clientes no Firestore
  const loadClientes = async () => {
    setLoading(true);
    try {
      const clientesRef = collection(db, "clientes");
      const snapshot = await getDocs(clientesRef);

      // Buscar situação de pagamento para cada cliente
      const data = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const clienteData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          };

          // Buscar último pagamento
          const ultimoPagamento = await buscarUltimoPagamento(clienteData.id, {
            getDocs,
            collection,
            query,
            where,
            orderBy,
            db,
          });

          // Calcular situação (plano atual é numérico, mas tratamos como "mensal")
          const situacao = calcularSituacao(
            ultimoPagamento,
            "mensal", // Todos os planos são mensais
            clienteData.ultimoPagamento || clienteData.dataCadastro
          );

          return {
            ...clienteData,
            ultimoPagamento: ultimoPagamento || clienteData.ultimoPagamento,
            situacaoPagamento: situacao,
          };
        })
      );

      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const clients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      `${c.nome} ${c.sobrenome || ""}`.toLowerCase().includes(q)
    );
  }, [query, clientes]);

  const goToHome = (c) => {
    const fullName = `${c.nome}${c.sobrenome ? " " + c.sobrenome : ""}`;
    localStorage.setItem("medfit_user_name", fullName);
    navigate("/home", {
      state: { name: fullName, newEntry: { peso: c.peso, altura: c.altura } },
    });
  };

  // Abre o modal de ações ao clicar no botão de editar
  const handleEditClick = (cliente) => {
    setClienteSelecionado(cliente);
    setModalOpen(true);
  };

  // Redireciona para a tela de edição
  const handleEditarDados = () => {
    if (!clienteSelecionado) return;

    const fullName = `${clienteSelecionado.nome}${
      clienteSelecionado.sobrenome ? " " + clienteSelecionado.sobrenome : ""
    }`;

    localStorage.setItem("medfit_user_name", fullName);

    setModalOpen(false);
    navigate("/avaliacao", {
      state: {
        name: fullName,
        clienteData: clienteSelecionado,
        clienteId: clienteSelecionado.id,
        from: "clientes",
      },
    });
  };

  // Alterna o status do cliente (ativo/inativo)
  const toggleClientStatus = async () => {
    if (!clienteSelecionado) return;

    try {
      const clienteRef = doc(db, "clientes", clienteSelecionado.id);
      const novoStatus = clienteSelecionado.status !== false ? false : true;
      
      await updateDoc(clienteRef, { status: novoStatus });
      
      // Atualiza o estado local
      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteSelecionado.id
            ? { ...c, status: novoStatus }
            : c
        )
      );

      setModalOpen(false);
      setClienteSelecionado(null);
    } catch (error) {
      console.error("Erro ao alterar status do cliente:", error);
      alert("Não foi possível alterar o status do cliente. Tente novamente.");
    }
  };

  const handleDelete = async (cliente) => {
    const confirmation = window.confirm(
      `Tem certeza de que deseja remover o cliente ${cliente.nome}?`
    );

    if (!confirmation) return;

    try {
      await deleteDoc(doc(db, "clientes", cliente.id));
      setClientes((prev) => prev.filter((item) => item.id !== cliente.id));
    } catch (error) {
      console.error("Erro ao apagar cliente:", error);
      alert("Não foi possível apagar o cliente. Tente novamente.");
    }
  };

  return (
    <div className="clientes-container">
      <div className="clientes-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <span
            className="material-symbols-rounded"
            style={{ fontVariationSettings: '"wght" 300' }}
          >
            arrow_back
          </span>
        </button>
        <h1 className="clientes-title">Clientes</h1>
        <button className="icon-btn" onClick={loadClientes} disabled={loading}>
          <span
            className="material-symbols-rounded"
            style={{ fontVariationSettings: '"wght" 300' }}
          >
            {loading ? "refresh" : "refresh"}
          </span>
        </button>
      </div>

      <label className="search-label" htmlFor="search">
        Buscar Cliente por Nome
      </label>
      <div className="search-box">
        <span
          className="material-symbols-rounded search-icon"
          style={{ fontVariationSettings: '"wght" 300' }}
        >
          search
        </span>
        <input
          id="search"
          className="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite o nome"
        />
      </div>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Idade</th>
              <th>Sexo</th>
              <th>Altura</th>
              <th>Peso</th>
              <th>Status</th>
              <th>Situação</th>
              <th className="acoes-header">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="8"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Carregando clientes...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : (
              clients.map((c) => {
                const isInativo = c.status === false;
                return (
                  <tr key={c.id} className={isInativo ? "cliente-inativo" : ""}>
                    <td>
                      <button 
                        className={`name-pill ${isInativo ? "name-pill-inativo" : ""}`} 
                        onClick={() => goToHome(c)}
                      >
                        {`${c.nome}${c.sobrenome ? " " + c.sobrenome : ""}`.toLowerCase()}
                      </button>
                    </td>
                    <td className={isInativo ? "texto-inativo" : ""}>{c.idade}</td>
                    <td className={isInativo ? "texto-inativo" : ""}>{c.sexo}</td>
                    <td className={isInativo ? "texto-inativo" : ""}>{c.altura}</td>
                    <td className={isInativo ? "texto-inativo" : ""}>{c.peso}</td>
                    <td>
                      <span className={`status-badge ${isInativo ? "status-inativo" : "status-ativo"}`}>
                        {isInativo ? "Inativo" : "Ativo"}
                      </span>
                    </td>
                    <td>
                      <span className={`situacao-badge ${c.situacaoPagamento === "ATRASADO" ? "situacao-atrasado" : "situacao-em-dia"}`}>
                        {c.situacaoPagamento || "EM DIA"}
                      </span>
                    </td>
                    <td>
                      <div className="acoes">
                        <button
                          type="button"
                          className="acao-btn editar"
                          onClick={() => handleEditClick(c)}
                        >
                          <span className="material-symbols-rounded">edit</span>
                        </button>
                        <button
                          type="button"
                          className="acao-btn apagar"
                          onClick={() => handleDelete(c)}
                        >
                          <span className="material-symbols-rounded">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ModalAcoesCliente
        cliente={clienteSelecionado}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setClienteSelecionado(null);
        }}
        onEditarDados={handleEditarDados}
        onToggleStatus={toggleClientStatus}
      />

      <BottomNav />
    </div>
  );
};

export default Clientes;
