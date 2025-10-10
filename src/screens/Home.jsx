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
    altura <= 0 ||
    peso <= 0
  )
    return null;
  
  // Converter altura para metros se estiver em cm (altura > 3)
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
    quadril <= 0 ||
    cintura <= 0
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
      <div className="min-h-screen bg-white font-poppins p-4 pb-20">
        <h1 className="text-2xl font-semibold text-gray-900 mb-5 text-blue-700">Carregando...</h1>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-poppins p-4 pb-20">
      {/* Título fixo no topo */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#0C518D',
            marginBottom: '20px',
            fontFamily: 'Racing Sans One, cursive'
          }}>{userName}</h1>
          {updating && (
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <span
                className="material-symbols-rounded text-base animate-spin"
              >
                refresh
              </span>
              Atualizando...
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo centralizado */}
      <div className="flex-1 flex flex-col gap-6 pt-5">

        {(clienteData || location?.state?.newEntry || location?.state?.name) && (
          <div style={{
            backgroundColor: '#A6D0F4',
            border: '1px solid #A6D0F4',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#0C518D',
              marginBottom: '8px'
            }}>{userName}</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '14px',
              color: '#0C518D'
            }}>
              {(clienteData?.idade || location?.state?.newEntry?.idade) && <div>Idade: {clienteData?.idade || location?.state?.newEntry?.idade} anos</div>}
              {(clienteData?.altura || location?.state?.newEntry?.altura) && <div>Altura: {clienteData?.altura || location?.state?.newEntry?.altura} cm</div>}
              {(clienteData?.peso || location?.state?.newEntry?.peso) && <div>Peso: {clienteData?.peso || location?.state?.newEntry?.peso} kg</div>}
              {(clienteData?.sexo || location?.state?.newEntry?.sexo) && <div>Sexo: {clienteData?.sexo || location?.state?.newEntry?.sexo}</div>}
            </div>
            {/* Exibir medidas se disponíveis */}
            {clienteData.medidas && (clienteData.medidas.cintura || clienteData.medidas.quadril) && (
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#0C518D',
                borderTop: '1px solid rgba(12, 81, 141, 0.2)',
                paddingTop: '8px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Medidas:</div>
                {clienteData.medidas.cintura && <div>Cintura: {clienteData.medidas.cintura} cm</div>}
                {clienteData.medidas.quadril && <div>Quadril: {clienteData.medidas.quadril} cm</div>}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-4 mt-3">
        <div className="bg-medfit-gray border border-gray-200 rounded-lg p-4 shadow-sm">
          <div style={{
            fontSize: '24px',
            fontWeight: '400',
            color: '#374151',
            marginBottom: '8px'
          }}>IMC</div>
          <div style={{
            fontSize: '24px',
            fontWeight: '400',
            color: '#0C518D'
          }}>
            {imcAtual ?? "-"}
          </div>
          {bmiCategory && (
            <div className="text-xs text-gray-600 mt-1">
              {bmiCategory}
            </div>
          )}
        </div>

        <div className="bg-medfit-gray border border-gray-200 rounded-lg p-4 shadow-sm">
          <div style={{
            fontSize: '24px',
            fontWeight: '400',
            color: '#374151',
            marginBottom: '8px'
          }}>RCQ</div>
          <div style={{
            fontSize: '24px',
            fontWeight: '400',
            color: '#0C518D'
          }}>
            {rcqAtual ?? "-"}
          </div>
          {rcqCategory && (
            <div className="text-xs text-gray-600 mt-1">
              {rcqCategory}
            </div>
          )}
          {cintura && quadril && (
            <div className="text-xs text-gray-500 mt-1">
              {cintura}cm / {quadril}cm
            </div>
          )}
        </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            className="w-full bg-medfit-blue text-white rounded-lg h-12 px-4 font-semibold font-poppins text-sm cursor-pointer"
            type="button"
            onClick={() => {
              navigate("/avaliacao", { state: { name: userName } });
            }}
          >
            Adicionar nova Avaliação
          </button>

          <div className="flex gap-2">
        <button
          className="flex-1 bg-gray-100 text-blue-700 rounded-lg h-12 px-4 font-medium font-poppins text-sm cursor-pointer border border-blue-700"
          type="button"
          onClick={() => {
            navigate("/historico", { state: { clienteData, userName } });
          }}
        >
          Ver Histórico completo
        </button>

        <button
          className="flex-shrink-0 w-auto px-4 flex items-center gap-2 bg-gray-100 text-blue-700 rounded-lg h-12 font-medium font-poppins text-sm cursor-pointer disabled:opacity-50 border-2 border-azulCustom"

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
          title="Atualizar dados"
        >
          <span className="material-symbols-rounded text-lg">
            refresh
          </span>
        </button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '100px' }}></div>
      <BottomNav />
    </div>
  );
};

export default Home;
