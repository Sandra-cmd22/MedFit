import { useEffect, useState } from "react";
import Calendar from "../components/Calendar.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../firebase.config";
import BottomNav from "../components/BottomNav.jsx";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

const Avaliacao = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const personName =
    location?.state?.name ||
    (typeof window !== "undefined"
      ? localStorage.getItem("medfit_user_name")
      : "") ||
    "";

  const [dataAvaliacao] = useState(new Date()); // Data automática (hoje)
  const [dataFinal, setDataFinal] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const [dadosBasicos, setDadosBasicos] = useState({
    idade: "",
    peso: "",
  });

  const [medidas, setMedidas] = useState({
    bracoDireito: "",
    bracoEsquerdo: "",
    bracoForcaDireito: "",
    bracoForcaEsquerdo: "",
    antebracoDireito: "",
    antebracoEsquerdo: "",
    coxaProximalDireita: "",
    coxaProximalEsquerda: "",
    coxaDistalDireita: "",
    coxaDistalEsquerda: "",
    panturrilhaDireita: "",
    panturrilhaEsquerda: "",
    torax: "",
    abdomen: "",
    cintura: "",
    quadril: "",
  });

  // Função para renderizar label com texto entre parênteses menor
  const renderLabel = (label) => {
    // Se o label já é um JSX element, retorna como está
    if (typeof label !== 'string') {
      return label;
    }
    
    const parts = label.split(/(\([^)]+\))/);
    return parts.map((part, index) => {
      if (part.startsWith('(') && part.endsWith(')')) {
        return <span key={index} className="text-parentheses">{part}</span>;
      }
      return part;
    });
  };

  // Componente de input reutilizável
  const InputField = ({ id, label, type = "text", value, onChange, ...props }) => (
    <div className="flex-1">
      <label className="text-sm text-gray-700 font-medium mb-1 block" htmlFor={id}>
        {renderLabel(label)}
      </label>
      <input
        className="w-full bg-white border border-gray-300 h-10 px-3 box-border text-black"
        style={{ borderRadius: '8px' }}
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        autoComplete="off"
        {...props}
      />
    </div>
  );

  // Componente de linha com dois inputs
  const InputRow = ({ children }) => (
    <div className="flex justify-between gap-3 mb-3-custom">
      {children}
    </div>
  );

  // Função para atualizar dados básicos
  const handleDadosBasicosChange = (field, value) => {
    setDadosBasicos((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Função para atualizar medidas
  const handleMedidaChange = (field, value) => {
    setMedidas((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    const loadClienteData = async () => {
      if (!personName) return;

      try {
        // 1. Cria uma referência para a coleção 'clientes'
        const clientesRef = collection(db, "clientes");

        // 2. Cria uma query para buscar o cliente pelo nome
        const q = query(clientesRef, where("nome", "==", personName));

        // 3. Executa a query
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Se o cliente for encontrado, pega o primeiro documento
          const clienteDoc = querySnapshot.docs[0];
          const clienteData = clienteDoc.data();

          // Carregar dados básicos se existirem
          setDadosBasicos({
            idade: clienteData.idade || "",
            peso: clienteData.peso || "",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      }
    };

    loadClienteData();
  }, [personName]);

  // Função para salvar avaliação
  const handleAtualizar = async () => {
    try {
      // 1. Buscar o cliente atual da coleção 'clientes'
      const clientesRef = collection(db, "clientes");
      const q = query(clientesRef, where("nome", "==", personName));
      const clientesSnapshot = await getDocs(q);

      if (clientesSnapshot.empty) {
        alert("Cliente não encontrado!");
        return;
      }

      const clienteDoc = clientesSnapshot.docs[0];
      const clienteAtual = clienteDoc.data();
      const clienteDocRef = doc(db, "clientes", clienteDoc.id);

      // 2. Salvar nova avaliação na coleção 'avaliacoes'
      const avaliacaoData = {
        clienteId: clienteDoc.id,
        clienteNome: personName,
        dataAvaliacao: dataAvaliacao.toISOString(),
        dataFinal: dataFinal.toISOString(),
        medidas: medidas,
        dadosBasicos: dadosBasicos,
      };

      await addDoc(collection(db, "avaliacoes"), avaliacaoData);

      // 3. Atualizar o cliente com os novos dados
      const clienteAtualizado = {
        ...clienteAtual,
        idade: dadosBasicos.idade || clienteAtual.idade,
        peso: dadosBasicos.peso || clienteAtual.peso,
        medidas: {
          ...clienteAtual.medidas,
          ...medidas,
        },
        dataUltimaAvaliacao: new Date().toISOString(),
      };

      await updateDoc(clienteDocRef, clienteAtualizado);

      // O localStorage para backup ainda funciona, mas é menos crítico
      const existingEvaluations = JSON.parse(
        localStorage.getItem("medfit_evaluations") || "[]"
      );

      const newEvaluation = {
        id: Date.now().toString(),
        date: dataAvaliacao.toISOString(),
        dataFinal: dataFinal.toISOString(),
        measures: medidas,
        dadosBasicos: dadosBasicos,
      };

      existingEvaluations.push(newEvaluation);
      localStorage.setItem("medfit_evaluations", JSON.stringify(existingEvaluations));

      // Navegar para home com os dados atualizados
      navigate("/home", {
        state: {
          name: personName,
          updatedData: {
            medidas: medidas,
            dadosBasicos: dadosBasicos,
          },
        },
      });
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      alert("Erro ao salvar avaliação. Tente novamente.");
    }
  };

  if (!personName || personName === "Home") {
    return (
      <div className="flex flex-col font-poppins min-h-screen bg-white text-sm pb-20">
        <div className="flex-grow p-3 bg-white">
          <div className="flex items-center gap-2 pb-2">
            <button 
              className="bg-transparent border-none p-1 cursor-pointer"
              onClick={() => navigate(-1)}
            >
              <span className="material-symbols-rounded text-2xl text-gray-700">arrow_back</span>
            </button>
            <h1 className="text-2xl font-medium m-0 text-center text-black flex-1">
              Avaliação
            </h1>
          </div>
          
          <div className="text-center py-12">
            <span className="material-symbols-rounded text-6xl text-gray-300 mb-4 block">
              person_search
            </span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Selecione ou Cadastre um Cliente
            </h2>
            <p className="text-gray-600 mb-8">
              Para realizar uma avaliação, você precisa primeiro selecionar um cliente cadastrado ou cadastrar um novo cliente.
            </p>
            
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <button
                className="w-full bg-blue-700 text-white rounded-lg h-12 px-4 font-semibold font-poppins text-sm cursor-pointer"
                onClick={() => navigate("/clientes")}
              >
                Selecionar Cliente
              </button>
              
              <button
                className="w-full bg-gray-100 text-blue-700 rounded-lg h-12 px-4 font-medium font-poppins text-sm cursor-pointer border border-blue-700"
                onClick={() => navigate("/cadastro")}
              >
                Cadastrar Novo Cliente
              </button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-poppins min-h-screen bg-white text-sm pb-20">
      <div className="flex-grow p-3 bg-white">
        <div className="flex items-center gap-2 pb-2">
          <button 
            className="bg-transparent border-none p-1 cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <span className="material-symbols-rounded text-2xl text-gray-700">arrow_back</span>
          </button>
          <h1 className="text-2xl font-medium m-0 text-center text-black flex-1">
            Avaliação
          </h1>
        </div>
        
        <div className="text-sm text-gray-600 ml-9 mb-3">
          {personName}
        </div>

        {/* Data Final */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Data Final</label>
          <div className="custom-datepicker flex items-center gap-2 cursor-pointer" onClick={() => setShowCalendar(!showCalendar)} style={{width: '146px'}}>
            <span className="material-symbols-rounded text-xl">event</span>
            <span>{dataFinal.toLocaleDateString("pt-BR")}</span>
          </div>
          
          {showCalendar && (
            <div className="mt-2 absolute z-10">
              <Calendar
                selectedDate={dataFinal}
                onDateSelect={(date) => {
                  setDataFinal(date);
                  setShowCalendar(false);
                }}
                className="w-full max-w-sm"
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Dados Básicos */}
          <h2 className="text-lg font-semibold mb-2">Dados Básicos</h2>
          
          <InputRow>
            <InputField 
              id="idade"
              label="Idade"
              type="number"
              value={dadosBasicos.idade}
              onChange={(e) => handleDadosBasicosChange("idade", e.target.value)}
            />
            <InputField 
              id="peso"
              label="Peso (kg)"
              type="number"
              value={dadosBasicos.peso}
              onChange={(e) => handleDadosBasicosChange("peso", e.target.value)}
            />
          </InputRow>

          {/* Medidas */}
          <h2 className="text-lg font-semibold mb-2">Medidas</h2>

          {/* Medidas Bilaterais */}
          <InputRow>
            <InputField 
              id="braco-direito"
              label="Braço (direito)"
              type="number"
              value={medidas.bracoDireito}
              onChange={(e) => handleMedidaChange("bracoDireito", e.target.value)}
            />
            <InputField 
              id="braco-esquerdo"
              label="Braço (esquerdo)"
              type="number"
              value={medidas.bracoEsquerdo}
              onChange={(e) => handleMedidaChange("bracoEsquerdo", e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="braco-forca-direito"
              label={
                <>
                  Braço <span className="text-parentheses">(força)</span> <span className="text-parentheses">(direito)</span>
                </>
              }
              type="number"
              value={medidas.bracoForcaDireito}
              onChange={(e) => handleMedidaChange("bracoForcaDireito", e.target.value)}
            />
            <InputField 
              id="braco-forca-esquerdo"
              label={
                <>
                  Braço <span className="text-parentheses">(força)</span> <span className="text-parentheses">(esquerdo)</span>
                </>
              }
              type="number"
              value={medidas.bracoForcaEsquerdo}
              onChange={(e) => handleMedidaChange("bracoForcaEsquerdo", e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="antebraco-direito"
              label="Antebraço (direito)"
              type="number"
              value={medidas.antebracoDireito}
              onChange={(e) => handleMedidaChange("antebracoDireito", e.target.value)}
            />
            <InputField 
              id="antebraco-esquerdo"
              label="Antebraço (esquerdo)"
              type="number"
              value={medidas.antebracoEsquerdo}
              onChange={(e) => handleMedidaChange("antebracoEsquerdo", e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="coxa-direita"
              label="Coxa (direita)"
              type="number"
              value={medidas.coxaProximalDireita}
              onChange={(e) => handleMedidaChange("coxaProximalDireita", e.target.value)}
            />
            <InputField 
              id="coxa-esquerda"
              label="Coxa (esquerda)"
              type="number"
              value={medidas.coxaProximalEsquerda}
              onChange={(e) => handleMedidaChange("coxaProximalEsquerda", e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="coxa-distal-direita"
              label="Coxa (distal) (direita)"
              type="number"
              value={medidas.coxaDistalDireita}
              onChange={(e) => handleMedidaChange("coxaDistalDireita", e.target.value)}
            />
            <InputField 
              id="coxa-distal-esquerda"
              label="Coxa (distal) (esquerda)"
              type="number"
              value={medidas.coxaDistalEsquerda}
              onChange={(e) => handleMedidaChange("coxaDistalEsquerda", e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="panturrilha-direita"
              label="Panturrilha (direita)"
              type="number"
              value={medidas.panturrilhaDireita}
              onChange={(e) => handleMedidaChange("panturrilhaDireita", e.target.value)}
            />
            <InputField 
              id="panturrilha-esquerda"
              label="Panturrilha (esquerda)"
              type="number"
              value={medidas.panturrilhaEsquerda}
              onChange={(e) => handleMedidaChange("panturrilhaEsquerda", e.target.value)}
            />
          </InputRow>

          {/* Medidas Unilaterais */}
          <InputRow>
            <InputField 
              id="torax"
              label="Tórax"
              type="number"
              value={medidas.torax}
              onChange={(e) => handleMedidaChange("torax", e.target.value)}
            />
            <InputField 
              id="abdomen"
              label="Abdômen"
              type="number"
              value={medidas.abdomen}
              onChange={(e) => handleMedidaChange("abdomen", e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="cintura"
              label="Cintura"
              type="number"
              value={medidas.cintura}
              onChange={(e) => handleMedidaChange("cintura", e.target.value)}
            />
            <InputField 
              id="quadril"
              label="Quadril"
              type="number"
              value={medidas.quadril}
              onChange={(e) => handleMedidaChange("quadril", e.target.value)}
            />
          </InputRow>

          <button
            className="bg-medfit-blue rounded-lg h-12 px-4 text-white font-semibold font-poppins text-sm border-none w-full mt-3 cursor-pointer"
            type="button"
            onClick={handleAtualizar}
          >
            Atualizar
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Avaliacao;
