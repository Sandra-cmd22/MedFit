import { addDoc, collection, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase.config.js";
import BottomNav from "../components/BottomNav.jsx";

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
const InputField = ({ id, label, type = "text", children, value, onChange, ...props }) => (
  <div className="flex-1">
    <label className="text-sm font-medium text-gray-700 block" htmlFor={id}>
      {renderLabel(label)}
    </label>
    {children || (
      <input 
        className="h-10 font-poppins text-sm border border-gray-300 bg-white px-3 w-full box-border text-gray-700 mb-3-custom" 
        style={{ borderRadius: '8px' }}
        type={type}
        id={id}
        value={value || ""}
        onChange={onChange}
        autoComplete="off"
        {...props}
      />
    )}
  </div>
);

// Componente de linha com dois inputs
const InputRow = ({ children }) => (
  <div className="flex justify-between gap-3 mb-3-custom">
    {children}
  </div>
);

const Cadastro = () => {
  const navigate = useNavigate();
  const [, setClientes] = useState([]);
  
  // Estado para controlar os valores dos campos
  const [formData, setFormData] = useState({
    nome: "",
    idade: "",
    altura: "",
    peso: "",
    sexo: "",
    medidas: {}
  });

  // Função para atualizar dados do formulário
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Função para atualizar medidas
  const updateMedidas = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      medidas: {
        ...prev.medidas,
        [field]: value
      }
    }));
  }, []);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const clientesRef = collection(db, "clientes");
        const clientesSnapshot = await getDocs(clientesRef);
        const clientesList = clientesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClientes(clientesList);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      }
    };

    fetchClientes();
  }, []);

  const handleCadastrar = async () => {
    try {
      // Validar campos obrigatórios
      if (!formData.nome.trim()) {
        alert("Nome é obrigatório");
        return;
      }

      if (!formData.altura || formData.altura <= 0) {
        alert("Altura é obrigatória e deve ser maior que zero");
        return;
      }

      if (!formData.peso || formData.peso <= 0) {
        alert("Peso é obrigatório e deve ser maior que zero");
        return;
      }

      if (!formData.sexo) {
        alert("Sexo é obrigatório");
        return;
      }

      // Converter strings para números
      const getNumber = (value) => {
        if (!value) return NaN;
        // Garantir que o valor seja uma string antes de processar
        const stringValue = String(value).replace(",", ".");
        const v = parseFloat(stringValue);
        return Number.isNaN(v) ? NaN : v;
      };

      const altura = getNumber(formData.altura);
      const peso = getNumber(formData.peso);

      // Coletar todas as medidas convertendo para números
      const medidas = {
        bracoDireito: getNumber(formData.medidas.bracoDireito),
        bracoEsquerdo: getNumber(formData.medidas.bracoEsquerdo),
        bracoForcaDireito: getNumber(formData.medidas.bracoForcaDireito),
        bracoForcaEsquerdo: getNumber(formData.medidas.bracoForcaEsquerdo),
        antebracoDireito: getNumber(formData.medidas.antebracoDireito),
        antebracoEsquerdo: getNumber(formData.medidas.antebracoEsquerdo),
        torax: getNumber(formData.medidas.torax),
        abdomen: getNumber(formData.medidas.abdomen),
        cintura: getNumber(formData.medidas.cintura),
        quadril: getNumber(formData.medidas.quadril),
        coxaProximalDireita: getNumber(formData.medidas.coxaProximalDireita),
        coxaProximalEsquerda: getNumber(formData.medidas.coxaProximalEsquerda),
        coxaDistalDireita: getNumber(formData.medidas.coxaDistalDireita),
        coxaDistalEsquerda: getNumber(formData.medidas.coxaDistalEsquerda),
        panturrilhaDireita: getNumber(formData.medidas.panturrilhaDireita),
        panturrilhaEsquerda: getNumber(formData.medidas.panturrilhaEsquerda),
      };

      const cliente = {
        nome: String(formData.nome || "").trim(),
        idade: String(formData.idade || "").trim(),
        altura: Number(altura) || 0,
        peso: Number(peso) || 0,
        sexo: String(formData.sexo || ""),
        medidas: {
          bracoDireito: Number(medidas.bracoDireito) || 0,
          bracoEsquerdo: Number(medidas.bracoEsquerdo) || 0,
          bracoForcaDireito: Number(medidas.bracoForcaDireito) || 0,
          bracoForcaEsquerdo: Number(medidas.bracoForcaEsquerdo) || 0,
          antebracoDireito: Number(medidas.antebracoDireito) || 0,
          antebracoEsquerdo: Number(medidas.antebracoEsquerdo) || 0,
          torax: Number(medidas.torax) || 0,
          abdomen: Number(medidas.abdomen) || 0,
          cintura: Number(medidas.cintura) || 0,
          quadril: Number(medidas.quadril) || 0,
          coxaProximalDireita: Number(medidas.coxaProximalDireita) || 0,
          coxaProximalEsquerda: Number(medidas.coxaProximalEsquerda) || 0,
          coxaDistalDireita: Number(medidas.coxaDistalDireita) || 0,
          coxaDistalEsquerda: Number(medidas.coxaDistalEsquerda) || 0,
          panturrilhaDireita: Number(medidas.panturrilhaDireita) || 0,
          panturrilhaEsquerda: Number(medidas.panturrilhaEsquerda) || 0,
        },
        dataCadastro: new Date().toISOString(),
      };

      // Salvar no Firestore
      const docRef = await addDoc(collection(db, "clientes"), cliente);

      // Salvar nome no localStorage para uso posterior
      localStorage.setItem("medfit_user_name", nome);

      // Navegar para home - garantir que todos os valores sejam primitivos
      const navigationState = {
        state: {
          newEntry: {
            peso: Number(peso) || 0,
            altura: Number(altura) || 0,
            cintura: Number(medidas.cintura) || 0,
            quadril: Number(medidas.quadril) || 0,
            sexo: String(formData.sexo || ""),
          },
          name: String(nome || ""),
          date: new Date().toISOString(),
        },
      };
      navigate("/home", navigationState);
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      alert("Erro ao cadastrar cliente. Tente novamente.");
    }
  };

  return (
    <div className="flex flex-col font-poppins min-h-screen">
      <div className="p-3 bg-white flex-1 pb-20">
        <div className="flex items-center justify-start gap-2 pb-8">
          <button 
            className="text-2xl text-gray-700 no-underline" 
            onClick={() => navigate(-1)}
          >
            <span className="material-symbols-rounded" style={{ fontVariationSettings: '"wght" 300' }}>
              arrow_back
            </span>
          </button>
          <h1 className="text-2xl font-medium m-0 text-black text-center mb-3 flex-1">Cadastro</h1>
          <div className="w-8" />
        </div>

        <div>
          <div className="mb-3-custom">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block" htmlFor="nome">
                Nome
              </label>
              <input 
                className="h-10 font-poppins text-sm border border-gray-300 bg-white px-3 w-full box-border text-gray-700" 
                style={{ borderRadius: '8px' }}
                type="text"
                id="nome"
                value={formData.nome}
                onChange={(e) => updateFormData('nome', e.target.value)}
              />
            </div>
          </div>

          <InputRow>
            <InputField 
              id="idade" 
              label="Idade" 
              value={formData.idade}
              onChange={(e) => updateFormData('idade', e.target.value)}
            />
            <InputField 
              id="altura" 
              label="Altura" 
              type="number"
              value={formData.altura}
              onChange={(e) => updateFormData('altura', e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="peso" 
              label="Peso" 
              type="number"
              value={formData.peso}
              onChange={(e) => updateFormData('peso', e.target.value)}
            />
            <InputField 
              id="sexo" 
              label="Sexo"
            >
              <select
                className="h-10 font-poppins text-sm border border-gray-300 bg-white px-3 w-full box-border text-gray-700 mb-3-custom"
                style={{ borderRadius: '8px' }}
                id="sexo"
                value={formData.sexo}
                onChange={(e) => updateFormData('sexo', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </InputField>
          </InputRow>


          {/* Título das Medidas */}
          <h2 className="text-lg font-bold mt-10 mb-2 text-black">Medidas</h2>

          {/* Medidas Bilaterais */}
          <InputRow>
            <InputField 
              id="braco-direito" 
              label="Braço (direito)" 
              type="number"
              value={formData.medidas.bracoDireito || ""}
              onChange={(e) => updateMedidas('bracoDireito', e.target.value)}
            />
            <InputField 
              id="braco-esquerdo" 
              label="Braço (esquerdo)" 
              type="number"
              value={formData.medidas.bracoEsquerdo || ""}
              onChange={(e) => updateMedidas('bracoEsquerdo', e.target.value)}
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
              value={formData.medidas.bracoForcaDireito || ""}
              onChange={(e) => updateMedidas('bracoForcaDireito', e.target.value)}
            />
            <InputField 
              id="braco-forca-esquerdo" 
              label={
                <>
                  Braço <span className="text-parentheses">(força)</span> <span className="text-parentheses">(esquerdo)</span>
                </>
              } 
              type="number"
              value={formData.medidas.bracoForcaEsquerdo || ""}
              onChange={(e) => updateMedidas('bracoForcaEsquerdo', e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="antebraco-direito" 
              label="Antebraço (direito)" 
              type="number"
              value={formData.medidas.antebracoDireito || ""}
              onChange={(e) => updateMedidas('antebracoDireito', e.target.value)}
            />
            <InputField 
              id="antebraco-esquerdo" 
              label="Antebraço (esquerdo)" 
              type="number"
              value={formData.medidas.antebracoEsquerdo || ""}
              onChange={(e) => updateMedidas('antebracoEsquerdo', e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="coxa-direita" 
              label="Coxa (direita)" 
              type="number"
              value={formData.medidas.coxaProximalDireita || ""}
              onChange={(e) => updateMedidas('coxaProximalDireita', e.target.value)}
            />
            <InputField 
              id="coxa-esquerda" 
              label="Coxa (esquerda)" 
              type="number"
              value={formData.medidas.coxaProximalEsquerda || ""}
              onChange={(e) => updateMedidas('coxaProximalEsquerda', e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="coxa-distal-direita" 
              label="Coxa (distal) (direita)" 
              type="number"
              value={formData.medidas.coxaDistalDireita || ""}
              onChange={(e) => updateMedidas('coxaDistalDireita', e.target.value)}
            />
            <InputField 
              id="coxa-distal-esquerda" 
              label="Coxa (distal) (esquerda)" 
              type="number"
              value={formData.medidas.coxaDistalEsquerda || ""}
              onChange={(e) => updateMedidas('coxaDistalEsquerda', e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="panturrilha-direita" 
              label="Panturrilha (direita)" 
              type="number"
              value={formData.medidas.panturrilhaDireita || ""}
              onChange={(e) => updateMedidas('panturrilhaDireita', e.target.value)}
            />
            <InputField 
              id="panturrilha-esquerda" 
              label="Panturrilha (esquerda)" 
              type="number"
              value={formData.medidas.panturrilhaEsquerda || ""}
              onChange={(e) => updateMedidas('panturrilhaEsquerda', e.target.value)}
            />
          </InputRow>

          {/* Medidas Unilaterais */}
          <InputRow>
            <InputField 
              id="torax" 
              label="Tórax" 
              type="number"
              value={formData.medidas.torax || ""}
              onChange={(e) => updateMedidas('torax', e.target.value)}
            />
            <InputField 
              id="abdomen" 
              label="Abdômen" 
              type="number"
              value={formData.medidas.abdomen || ""}
              onChange={(e) => updateMedidas('abdomen', e.target.value)}
            />
          </InputRow>

          <InputRow>
            <InputField 
              id="cintura" 
              label="Cintura" 
              type="number"
              value={formData.medidas.cintura || ""}
              onChange={(e) => updateMedidas('cintura', e.target.value)}
            />
            <InputField 
              id="quadril" 
              label="Quadril" 
              type="number"
              value={formData.medidas.quadril || ""}
              onChange={(e) => updateMedidas('quadril', e.target.value)}
            />
          </InputRow>

          <button 
            type="button" 
            className="bg-medfit-blue rounded-lg p-4 mt-5 mb-button w-full cursor-pointer" 
            onClick={handleCadastrar}
          >
            <span className="text-white text-center block w-full text-sm font-bold">Cadastrar</span>
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Cadastro;
