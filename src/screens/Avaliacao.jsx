import { ptBR } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../firebase.config";
import BottomNav from "../components/BottomNav.jsx";
import "./Avaliacao.css";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
registerLocale("pt-BR", ptBR);

const createEmptyMedidas = () => ({
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
  cintura: "",
  quadril: "",
  abdomen: "",
});

const Avaliacao = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const clienteDataFromState = location?.state?.clienteData || null;
  const clienteIdFromState =
    location?.state?.clienteId || clienteDataFromState?.id || null;
  const personName =
    location?.state?.name ||
    (typeof window !== "undefined"
      ? localStorage.getItem("medfit_user_name")
      : "") ||
    "";

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // Estado para dados básicos e medidas
  const [dadosBasicos, setDadosBasicos] = useState({
    idade: clienteDataFromState?.idade || "",
    peso: clienteDataFromState?.peso || "",
  });

  const [medidas, setMedidas] = useState(() =>
    clienteDataFromState?.medidas
      ? {
          ...createEmptyMedidas(),
          ...Object.entries(clienteDataFromState.medidas).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]:
                value === undefined || value === null
                  ? ""
                  : typeof value === "number"
                  ? value.toString()
                  : value,
            }),
            {}
          ),
        }
      : createEmptyMedidas()
  );
  const [clienteDocId, setClienteDocId] = useState(clienteIdFromState || null);
  const [clienteInfo, setClienteInfo] = useState(clienteDataFromState || null);

  const medidasNormalizadas = useMemo(() => {
    const normalizadas = {};
    Object.entries(medidas).forEach(([key, value]) => {
      normalizadas[key] =
        value === undefined || value === null ? "" : value.toString();
    });
    return normalizadas;
  }, [medidas]);

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

  // Carregar dados do cliente ao abrir a tela
  useEffect(() => {
    const fillFromData = (data, id) => {
      if (!data) return;
      setClienteInfo(data);
      setClienteDocId((prev) => id || prev || clienteIdFromState || data.id || null);
      setDadosBasicos({
        idade: data.idade || "",
        peso: data.peso || "",
      });

      const medidasPreenchidas = createEmptyMedidas();
      Object.keys(medidasPreenchidas).forEach((key) => {
        const valor = data?.medidas?.[key];
        medidasPreenchidas[key] =
          valor === undefined || valor === null
            ? ""
            : typeof valor === "number"
            ? valor.toString()
            : valor;
      });
      setMedidas(medidasPreenchidas);
    };

    if (clienteDataFromState) {
      fillFromData(clienteDataFromState, clienteIdFromState);
      return;
    }

    if (!personName) return;

    const loadClienteData = async () => {
      try {
        const clientesRef = collection(db, "clientes");
        const q = query(clientesRef, where("nome", "==", personName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const clienteDoc = querySnapshot.docs[0];
          const clienteData = clienteDoc.data();
          fillFromData(clienteData, clienteDoc.id);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      }
    };

    loadClienteData();
  }, [clienteDataFromState, clienteIdFromState, personName]);

  // Função para salvar avaliação
  const handleAtualizar = async () => {
    try {
      // 1. Obter dados do cliente que será atualizado
      let clienteId = clienteDocId;
      let clienteAtual = clienteInfo;

      if (!clienteId || !clienteAtual) {
        const clientesRef = collection(db, "clientes");
        const q = query(clientesRef, where("nome", "==", personName));
        const clientesSnapshot = await getDocs(q);

        if (clientesSnapshot.empty) {
          alert(
            "Cliente não encontrado. Por favor, cadastre o cliente primeiro."
          );
          return;
        }

        const clienteDoc = clientesSnapshot.docs[0];
        clienteAtual = clienteDoc.data();
        clienteId = clienteDoc.id;
        setClienteDocId(clienteId);
        setClienteInfo(clienteAtual);
      } else {
        try {
          const clienteDocRef = doc(db, "clientes", clienteId);
          const snapshot = await getDoc(clienteDocRef);
          if (snapshot.exists()) {
            clienteAtual = snapshot.data();
            setClienteInfo(clienteAtual);
          }
        } catch (error) {
          console.warn(
            "Não foi possível obter dados atualizados do cliente, usando cache local.",
            error
          );
        }
      }

      if (!clienteAtual) {
        alert("Não foi possível carregar os dados do cliente.");
        return;
      }

      // 2. Preparar dados da nova avaliação
      const newEvaluation = {
        clienteId, // Usa o ID do documento do cliente
        clienteNome: personName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        medidas: medidasNormalizadas,
        evaluationDate: new Date().toISOString(),
      };

      // 3. Salvar avaliação na coleção 'avaliacoes'
      const avaliacoesRef = collection(db, "avaliacoes");
      await addDoc(avaliacoesRef, newEvaluation);

      // 4. Atualizar dados do cliente na coleção 'clientes'
      // Usa o ID do documento para atualizar o cliente específico
      const clienteDocRef = doc(db, "clientes", clienteId);
      const clienteAtualizado = {
        ...clienteAtual,
        idade: dadosBasicos.idade || clienteAtual.idade,
        peso: dadosBasicos.peso || clienteAtual.peso,
        medidas: {
          ...clienteAtual.medidas,
          ...medidasNormalizadas,
        },
        dataUltimaAvaliacao: new Date().toISOString(),
      };

      await updateDoc(clienteDocRef, clienteAtualizado);
      setClienteInfo(clienteAtualizado);

      // O localStorage para backup ainda funciona, mas é menos crítico
      const existingEvaluations = JSON.parse(
        localStorage.getItem("medfit_evaluations") || "[]"
      );
      existingEvaluations.push(newEvaluation);
      localStorage.setItem(
        "medfit_evaluations",
        JSON.stringify(existingEvaluations)
      );

      // Atualizar última data de avaliação no localStorage
      localStorage.setItem(
        "medfit_last_evaluation_date",
        new Date().toLocaleDateString("pt-BR")
      );

      // Navegar para a tela home com os dados atualizados
      navigate("/home", {
        state: {
          name: personName,
          newEntry: {
            ...medidasNormalizadas,
            idade: dadosBasicos.idade || clienteAtual.idade,
            peso: dadosBasicos.peso || clienteAtual.peso,
            altura: clienteAtual.altura,
            cintura: medidasNormalizadas.cintura || "",
            quadril: medidasNormalizadas.quadril || "",
          },
        },
      });

      alert("Avaliação salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      alert("Erro ao salvar a avaliação. Tente novamente.");
    }
  };

  return (
    <div className="container-av">
      <div className="scroll-view-av">
        <div className="header-av">
          <button className="back-btn-av" onClick={() => navigate(-1)}>
            <span
              className="material-symbols-rounded"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              arrow_back
            </span>
          </button>
          <h1 className="title-av">Avaliação</h1>
        </div>
        {personName && <div className="person-name">{personName}</div>}

        <div className="date-row-av">
          <div className="date-group-av">
            <span className="date-label-av">Data inicial</span>
            <div className="date-field-av">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                locale="pt-BR"
                dateFormat="dd/MM/yyyy"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={15}
                popperPlacement="bottom-start"
                popperModifiers={[
                  { name: "offset", options: { offset: [0, 8] } },
                  {
                    name: "preventOverflow",
                    options: { rootBoundary: "viewport", padding: 8 },
                  },
                  {
                    name: "flip",
                    options: {
                      fallbackPlacements: ["top-start", "bottom-end"],
                    },
                  },
                ]}
                calendarClassName="custom-datepicker"
                customInput={
                  <button
                    type="button"
                    className="date-btn-av"
                    aria-label="Selecionar data inicial"
                  >
                    <span
                      className="material-symbols-rounded date-icon-av"
                      style={{ color: "#fff" }}
                    >
                      calendar_month
                    </span>
                    <span className="date-text-av">
                      {startDate.toLocaleDateString("pt-BR")}
                    </span>
                  </button>
                }
              />
            </div>
          </div>
          <div className="date-group-av">
            <span className="date-label-av">Data final</span>
            <div className="date-field-av">
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                locale="pt-BR"
                dateFormat="dd/MM/yyyy"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={15}
                popperPlacement="bottom-start"
                popperModifiers={[
                  { name: "offset", options: { offset: [0, 8] } },
                  {
                    name: "preventOverflow",
                    options: { rootBoundary: "viewport", padding: 8 },
                  },
                  {
                    name: "flip",
                    options: {
                      fallbackPlacements: ["top-start", "bottom-end"],
                    },
                  },
                ]}
                calendarClassName="custom-datepicker"
                customInput={
                  <button
                    type="button"
                    className="date-btn-av"
                    aria-label="Selecionar data final"
                  >
                    <span
                      className="material-symbols-rounded date-icon-av"
                      style={{ color: "#fff" }}
                    >
                      calendar_month
                    </span>
                    <span className="date-text-av">
                      {endDate.toLocaleDateString("pt-BR")}
                    </span>
                  </button>
                }
              />
            </div>
          </div>
        </div>

        <div className="section-title-av">Dados Básicos</div>

        <div className="row-av">
          <div className="col-av">
            <label className="label-av" htmlFor="idade">
              Idade
            </label>
            <input
              className="input-av"
              type="number"
              id="idade"
              inputMode="numeric"
              min="1"
              max="120"
              value={dadosBasicos.idade}
              onChange={(e) =>
                handleDadosBasicosChange("idade", e.target.value)
              }
            />
          </div>
          <div className="col-av">
            <label className="label-av" htmlFor="peso">
              Peso (kg)
            </label>
            <input
              className="input-av"
              type="number"
              id="peso"
              inputMode="decimal"
              step="0.1"
              min="1"
              max="300"
              value={dadosBasicos.peso}
              onChange={(e) => handleDadosBasicosChange("peso", e.target.value)}
            />
          </div>
        </div>

        <div className="section-title-av">Medidas</div>

        <div className="row-av">
          <div className="col-av">
            <label className="label-av" htmlFor="braco-direito">
              Braço <span className="paren">(direito)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="braco-direito"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.bracoDireito}
              onChange={(e) =>
                handleMedidaChange("bracoDireito", e.target.value)
              }
            />
          </div>
          <div className="col-av">
            <label className="label-av" htmlFor="braco-esquerdo">
              Braço <span className="paren">(esquerdo)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="braco-esquerdo"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.bracoEsquerdo}
              onChange={(e) =>
                handleMedidaChange("bracoEsquerdo", e.target.value)
              }
            />
          </div>
        </div>

        <div className="row-av">
          <div className="col-av">
            <label className="label-av" htmlFor="braco-forca-direito">
              Braço <span className="paren">(força)</span>{" "}
              <span className="paren">(direito)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="braco-forca-direito"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.bracoForcaDireito}
              onChange={(e) =>
                handleMedidaChange("bracoForcaDireito", e.target.value)
              }
            />
          </div>
          <div className="col-av">
            <label className="label-av" htmlFor="braco-forca-esquerdo">
              Braço <span className="paren">(força)</span>{" "}
              <span className="paren">(esquerdo)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="braco-forca-esquerdo"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.bracoForcaEsquerdo}
              onChange={(e) =>
                handleMedidaChange("bracoForcaEsquerdo", e.target.value)
              }
            />
          </div>
        </div>

        <div className="row-av">
          <div className="col-av">
            <label className="label-av" htmlFor="antebraco-direito">
              Antebraço <span className="paren">(direito)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="antebraco-direito"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.antebracoDireito}
              onChange={(e) =>
                handleMedidaChange("antebracoDireito", e.target.value)
              }
            />
          </div>
          <div className="col-av">
            <label className="label-av" htmlFor="antebraco-esquerdo">
              Antebraço <span className="paren">(esquerdo)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="antebraco-esquerdo"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.antebracoEsquerdo}
              onChange={(e) =>
                handleMedidaChange("antebracoEsquerdo", e.target.value)
              }
            />
          </div>
        </div>

        {/* Unilateral fields moved to the end: tórax, cintura, quadril */}

        <div className="row-av">
          <div className="col-av">
            <label className="label-av" htmlFor="coxa-proximal-direita">
              Coxa <span className="paren">(proximal) (direita)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="coxa-proximal-direita"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.coxaProximalDireita}
              onChange={(e) =>
                handleMedidaChange("coxaProximalDireita", e.target.value)
              }
            />
          </div>
          <div className="col-av">
            <label className="label-av" htmlFor="coxa-proximal-esquerda">
              Coxa <span className="paren">(proximal) (esquerda)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="coxa-proximal-esquerda"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.coxaProximalEsquerda}
              onChange={(e) =>
                handleMedidaChange("coxaProximalEsquerda", e.target.value)
              }
            />
          </div>
        </div>

        <div className="row-av">
          <div className="col-av">
            <label className="label-av" htmlFor="coxa-distal-direita">
              Coxa <span className="paren">(distal) (direita)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="coxa-distal-direita"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.coxaDistalDireita}
              onChange={(e) =>
                handleMedidaChange("coxaDistalDireita", e.target.value)
              }
            />
          </div>
          <div className="col-av">
            <label className="label-av" htmlFor="coxa-distal-esquerda">
              Coxa <span className="paren">(distal) (esquerda)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="coxa-distal-esquerda"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.coxaDistalEsquerda}
              onChange={(e) =>
                handleMedidaChange("coxaDistalEsquerda", e.target.value)
              }
            />
          </div>
        </div>

        <div className="row-av">
          <div className="col-av">
            <label className="label-av" htmlFor="panturrilha-direita">
              Panturrilha <span className="paren">(direita)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="panturrilha-direita"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.panturrilhaDireita}
              onChange={(e) =>
                handleMedidaChange("panturrilhaDireita", e.target.value)
              }
            />
          </div>
          <div className="col-av">
            <label className="label-av" htmlFor="panturrilha-esquerda">
              Panturrilha <span className="paren">(esquerda)</span>
            </label>
            <input
              className="input-av"
              type="number"
              id="panturrilha-esquerda"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.panturrilhaEsquerda}
              onChange={(e) =>
                handleMedidaChange("panturrilhaEsquerda", e.target.value)
              }
            />
          </div>
        </div>

        {/* Unilateral fields */}
        <div className="row-av">
          <div className="col-av">
            <label className="label-av" htmlFor="torax">
              Tórax
            </label>
            <input
              className="input-av"
              type="number"
              id="torax"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.torax}
              onChange={(e) => handleMedidaChange("torax", e.target.value)}
            />
          </div>
          <div className="col-av">
            <label className="label-av" htmlFor="abdomen">
              Abdômen
            </label>
            <input
              className="input-av"
              type="number"
              id="abdomen"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.abdomen}
              onChange={(e) => handleMedidaChange("abdomen", e.target.value)}
            />
          </div>
        </div>

        <div className="row-av">
          <div className="col-av">
            <label className="label-av" htmlFor="cintura">
              Cintura
            </label>
            <input
              className="input-av"
              type="number"
              id="cintura"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.cintura}
              onChange={(e) => handleMedidaChange("cintura", e.target.value)}
            />
          </div>
          
          <div className="col-av">
            <label className="label-av" htmlFor="quadril">
              Quadril
            </label>
            <input
              className="input-av"
              type="number"
              id="quadril"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={medidas.quadril}
              onChange={(e) => handleMedidaChange("quadril", e.target.value)}
            />
          </div>
        </div>


        <button
          className="primary-btn-av"
          type="button"
          onClick={handleAtualizar}
        >
          Atualizar
        </button>
      </div>
      <BottomNav />
    </div>
  );
};

export default Avaliacao;
