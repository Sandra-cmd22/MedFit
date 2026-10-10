import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase.js";
import {
  computeBMI,
  computeRCQ,
  formatAltura,
  getBMICategory,
  getRCQCategory,
  MEDIDAS_CAMPOS,
} from "../utils/indices.js";
import { criarCarregadorAluno } from "../utils/carregadorAluno.js";
import EvolucaoCorporal from "../components/EvolucaoCorporal.jsx";
import "./Home.css";

const BADGE_POR_CATEGORIA = {
  "Peso normal": "badge-green",
  "Abaixo do peso": "badge-amber",
  Sobrepeso: "badge-amber",
  "Baixo risco": "badge-green",
  "Risco moderado": "badge-amber",
};

const badgeClass = (categoria) => BADGE_POR_CATEGORIA[categoria] || "badge-red";

const formatDate = (value) => {
  if (!value) return null;
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("pt-BR");
};

const formatDateOuTraco = (value) => formatDate(value) || "-";

const dataDaAvaliacao = (av) => av.evaluationDate || av.startDate || av.endDate || "";

const buscarAvaliacoes = async (clienteNome, clienteId) => {
  const avaliacoesRef = collection(db, "avaliacoes");
  const consultas = [query(avaliacoesRef, where("clienteNome", "==", clienteNome))];
  if (clienteId) {
    consultas.push(query(avaliacoesRef, where("clienteId", "==", clienteId)));
  }

  const porId = new Map();
  const snapshots = await Promise.all(consultas.map((q) => getDocs(q)));
  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((d) => {
      if (!porId.has(d.id)) porId.set(d.id, { id: d.id, ...d.data() });
    });
  });

  return [...porId.values()].sort(
    (a, b) => new Date(dataDaAvaliacao(b)) - new Date(dataDaAvaliacao(a))
  );
};

const buscarCliente = async (userName) => {
  // Busca cliente pelo campo "nome"
  const clientesRef = collection(db, "clientes");
  let querySnapshot = await getDocs(
    query(clientesRef, where("nome", "==", userName))
  );

  // Fallback: nome exibido pode vir como "Nome Sobrenome"
  if (querySnapshot.empty && userName.includes(" ")) {
    const [nome, ...rest] = userName.split(" ").filter(Boolean);
    const sobrenome = rest.join(" ").trim();
    if (nome && sobrenome) {
      querySnapshot = await getDocs(
        query(
          clientesRef,
          where("nome", "==", nome),
          where("sobrenome", "==", sobrenome)
        )
      );
    }
  }

  if (querySnapshot.empty) return null;
  const clienteDoc = querySnapshot.docs[0];
  return { id: clienteDoc.id, data: clienteDoc.data() };
};

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clienteData, setClienteData] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(false);
  const [erroAvaliacoes, setErroAvaliacoes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [carregador] = useState(() =>
    criarCarregadorAluno({
      buscarCliente,
      buscarAvaliacoes,
      aplicar: (estado) => {
        if ("cliente" in estado) setClienteData(estado.cliente);
        if ("avaliacoes" in estado) setAvaliacoes(estado.avaliacoes);
        if ("carregandoAvaliacoes" in estado) setCarregandoAvaliacoes(estado.carregandoAvaliacoes);
        if ("erroAvaliacoes" in estado) setErroAvaliacoes(estado.erroAvaliacoes);
      },
    })
  );

  // Função para buscar dados atualizados do cliente
  const fetchClienteData = async (userName, isUpdate = false) => {
    if (!userName || userName === "Home") {
      carregador.cancelar();
      setLoading(false);
      return;
    }

    if (isUpdate) {
      setUpdating(true);
    }

    const resultado = await carregador.carregar(userName);
    if (resultado.status === "obsoleta") return;

    if (resultado.status === "erro") {
      console.error(
        resultado.etapa === "cliente"
          ? "Erro ao carregar dados do cliente:"
          : "Erro ao carregar avaliações do cliente:",
        resultado.error
      );
    }
    setLoading(false);
    setUpdating(false);
  };
  // Buscar dados do cliente
  useEffect(() => {
    const userName =
      location?.state?.name ||
      (typeof window !== "undefined"
        ? localStorage.getItem("medfit_user_name") || "Home"
        : "Home");
    fetchClienteData(userName);
  }, [location?.state?.name, location?.state?.newEntry]);

  // Atualizar dados quando a página ganhar foco (volta da avaliação)
  useEffect(() => {
    const handleFocus = () => {
      const userName =
        typeof window !== "undefined"
          ? localStorage.getItem("medfit_user_name") || "Home"
          : "Home";
      if (userName && userName !== "Home") {
        fetchClienteData(userName, true);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const userName =
    location?.state?.name ||
    (typeof window !== "undefined"
      ? localStorage.getItem("medfit_user_name") || "Home"
      : "Home");

  const handleRefresh = () => {
    const nome =
      typeof window !== "undefined"
        ? localStorage.getItem("medfit_user_name") || "Home"
        : "Home";
    if (nome && nome !== "Home") {
      fetchClienteData(nome, true);
    }
  };

  // Usar dados do cliente se disponível, senão usar dados da navegação
  const peso = clienteData?.peso || location?.state?.newEntry?.peso;
  const altura = clienteData?.altura || location?.state?.newEntry?.altura;
  const sexo = clienteData?.sexo || location?.state?.newEntry?.sexo;
  const cintura =
    clienteData?.medidas?.cintura || location?.state?.newEntry?.cintura;
  const quadril =
    clienteData?.medidas?.quadril || location?.state?.newEntry?.quadril;

  const imcAtual = computeBMI(peso, altura);
  const rcqAtual = computeRCQ(cintura, quadril);
  const bmiCategory = getBMICategory(imcAtual);
  const rcqCategory = getRCQCategory(rcqAtual, sexo);

  if (loading) {
    return (
      <div className="page">
        <p className="page-subtitle">Carregando dados do cliente...</p>
      </div>
    );
  }

  if (!userName || userName === "Home") {
    return (
      <div className="page">
        <div className="panel">
          <div className="empty-state">
            <span className="material-symbols-rounded">person_search</span>
            <h3>Nenhum cliente selecionado</h3>
            <p>Escolha um cliente na lista para ver o painel de avaliação.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/clientes")}
            >
              Ver clientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ultimaAvaliacao = formatDate(clienteData?.dataUltimaAvaliacao);
  const dataCadastro = formatDate(clienteData?.dataCadastro);
  const medidasCliente = clienteData?.medidas || {};

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Painel do cliente</p>
          <h1 className="page-title home-client-name">{userName}</h1>
          <p className="page-subtitle">
            {ultimaAvaliacao
              ? `Última avaliação em ${ultimaAvaliacao}`
              : dataCadastro
              ? `Cliente desde ${dataCadastro}`
              : "Sem avaliações registradas"}
            {updating && " · Atualizando..."}
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-outline btn-icon"
            onClick={handleRefresh}
            disabled={updating}
            title="Atualizar dados"
          >
            <span className="material-symbols-rounded">refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              navigate("/historico", { state: { clienteData, userName } });
            }}
          >
            <span className="material-symbols-rounded">history</span>
            Ver histórico
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              navigate("/avaliacao", { state: { name: userName } });
            }}
          >
            <span className="material-symbols-rounded">add</span>
            Nova avaliação
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <p className="stat-label">IMC</p>
          <p className="stat-value">{imcAtual ?? "-"}</p>
          <div className="stat-foot">
            {bmiCategory ? (
              <span className={`badge ${badgeClass(bmiCategory)}`}>{bmiCategory}</span>
            ) : (
              "Informe peso e altura"
            )}
          </div>
        </div>

        <div className="stat">
          <p className="stat-label">RCQ</p>
          <p className="stat-value">{rcqAtual ?? "-"}</p>
          <div className="stat-foot">
            {rcqCategory ? (
              <span className={`badge ${badgeClass(rcqCategory)}`}>{rcqCategory}</span>
            ) : (
              "Informe cintura e quadril"
            )}
            {cintura && quadril && (
              <span className="home-rcq-relation">
                {cintura} cm / {quadril} cm
              </span>
            )}
          </div>
        </div>

        <div className="stat">
          <p className="stat-label">Peso</p>
          <p className="stat-value">
            {peso || "-"}
            {peso && <span className="stat-unit">kg</span>}
          </p>
          <div className="stat-foot">Registrado na última avaliação</div>
        </div>

        <div className="stat">
          <p className="stat-label">Altura</p>
          <p className="stat-value">{formatAltura(altura)}</p>
          <div className="stat-foot">Informada no cadastro</div>
        </div>
      </div>

      <EvolucaoCorporal
        avaliacoes={avaliacoes}
        formatDate={formatDateOuTraco}
        carregando={carregandoAvaliacoes}
        erro={erroAvaliacoes}
      />

      <div className="home-columns">
        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="material-symbols-rounded">straighten</span>
              Medidas atuais
            </h2>
            <span className="panel-hint">Valores em centímetros</span>
          </div>
          <div className="measure-grid">
            {MEDIDAS_CAMPOS.map(({ key, label }) => (
              <div className="measure" key={key}>
                <p className="measure-label">{label}</p>
                <p className="measure-value">{medidasCliente[key] || "-"}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="material-symbols-rounded">badge</span>
              Dados do cliente
            </h2>
          </div>
          <dl className="home-details">
            <div>
              <dt>Idade</dt>
              <dd>{clienteData?.idade ? `${clienteData.idade} anos` : "-"}</dd>
            </div>
            <div>
              <dt>Sexo</dt>
              <dd>{clienteData?.sexo || "-"}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{clienteData?.telefone || "-"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{clienteData?.email || "-"}</dd>
            </div>
            <div>
              <dt>Cidade</dt>
              <dd>
                {[clienteData?.cidade, clienteData?.estado].filter(Boolean).join(" / ") || "-"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
};

export default Home;
