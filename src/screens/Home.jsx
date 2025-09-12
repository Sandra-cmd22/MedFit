import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Importe useNavigate
import { db } from "../../firebase.config.js";
import BottomNav from "../components/BottomNav.jsx";
import "./Home.css";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const STORAGE_KEY = "medfit_quarterly";

function computeBMI(peso, altura) {
  if (
    !peso ||
    !altura ||
    Number.isNaN(peso) ||
    Number.isNaN(altura) ||
    altura <= 0
  )
    return null;
  const h = altura > 3 ? altura / 100 : altura;
  const bmi = peso / (h * h);
  return Math.round(bmi * 10) / 10; // Arredonda para 1 casa decimal
}

function computeRCQ(cintura, quadril) {
  if (
    !cintura ||
    !quadril ||
    Number.isNaN(cintura) ||
    Number.isNaN(quadril) ||
    quadril <= 0
  )
    return null;
  const rcq = cintura / quadril;
  return Math.round(rcq * 100) / 100; // Arredonda para 2 casas decimais
}

function getBMICategory(bmi) {
  if (bmi === null) return null;
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  if (bmi < 35) return "Obesidade grau I";
  if (bmi < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

function getRCQCategory(rcq, sexo) {
  if (rcq === null) return null;
  if (sexo === "Masculino") {
    if (rcq < 0.85) return "Baixo risco";
    if (rcq < 0.95) return "Risco moderado";
    return "Alto risco";
  } else {
    if (rcq < 0.8) return "Baixo risco";
    if (rcq < 0.85) return "Risco moderado";
    return "Alto risco";
  }
}

// function polarToCartesian(cx, cy, r, angleDeg) {
//   const rad = (Math.PI / 180) * angleDeg;
//   return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
// }

// function describeArc(cx, cy, r, startAngle, endAngle) {
//   const start = polarToCartesian(cx, cy, r, endAngle);
//   const end = polarToCartesian(cx, cy, r, startAngle);
//   const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
//   return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
// }

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clienteData, setClienteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Função para buscar dados atualizados do cliente
  const fetchClienteData = async (userName, isUpdate = false) => {
    if (!userName || userName === "Home") {
      setLoading(false);
      return;
    }

    if (isUpdate) {
      setUpdating(true);
    }

    try {
      // Busca cliente pelo campo "nome"
      const clientesRef = collection(db, "clientes");
      const q = query(clientesRef, where("nome", "==", userName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const cliente = querySnapshot.docs[0].data();
        setClienteData(cliente);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do cliente:", error);
    } finally {
      setLoading(false);
      if (isUpdate) {
        setUpdating(false);
      }
    }
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
      <div className="home-container">
        <h1 className="home-title">Carregando...</h1>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Título fixo no topo */}
      <div className="home-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <h1 className="home-title">{userName}</h1>
          {updating && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#0C518D",
              }}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: "16px", animation: "spin 1s linear infinite" }}
              >
                refresh
              </span>
              Atualizando...
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo centralizado */}
      <div className="home-content">

        {clienteData && (
          <div style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>
            <div>Idade: {clienteData.idade || "-"} anos</div>
            <div>Altura: {clienteData.altura || "-"} cm</div>
            <div>Peso: {clienteData.peso || "-"} kg</div>
            <div>Sexo: {clienteData.sexo || "-"}</div>
          </div>
        )}

        <div className="cards-column">
        <div className="card">
          <div className="card-header">IMC</div>
          <div className="card-value" style={{ color: "#0C518D" }}>
            {imcAtual ?? "-"}
          </div>
          {bmiCategory && (
            <div
              className="card-category"
              style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}
            >
              {bmiCategory}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">RCQ</div>
          <div className="card-value" style={{ color: "#0C518D" }}>
            {rcqAtual ?? "-"}
          </div>
          {rcqCategory && (
            <div
              className="card-category"
              style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}
            >
              {rcqCategory}
            </div>
          )}
          {cintura && quadril && (
            <div
              className="card-relation"
              style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}
            >
              {cintura}cm / {quadril}cm
            </div>
          )}
        </div>
        </div>

        <button
        className="primary-btn"
        type="button"
        onClick={() => {
          navigate("/avaliacao", { state: { name: userName } });
        }}
      >
        Adicionar nova Avaliação
        </button>

        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <button
          className="secondary-btn"
          type="button"
          onClick={() => {
            navigate("/historico", { state: { clienteData, userName } });
          }}
          style={{ flex: 1 }}
        >
          Ver Histórico completo
        </button>

        <button
          className="secondary-btn"
          type="button"
          onClick={() => {
            const userName =
              typeof window !== "undefined"
                ? localStorage.getItem("medfit_user_name") || "Home"
                : "Home";
            if (userName && userName !== "Home") {
              fetchClienteData(userName, true);
            }
          }}
          disabled={updating}
          style={{
            flex: "0 0 auto",
            width: "auto",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          title="Atualizar dados"
        >
          <span
            className="material-symbols-rounded"
            style={{ fontSize: "18px" }}
          >
            refresh
          </span>
        </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
