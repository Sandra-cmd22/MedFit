import { useEffect, useMemo, useState } from "react";
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

const formatCPF = (value) => {
  const numbers = (value || "").toString().replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9)
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
      6
    )}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
    6,
    9
  )}-${numbers.slice(9, 11)}`;
};

const formatTelefone = (value) => {
  const numbers = (value || "").toString().replace(/\D/g, "");
  if (numbers.length <= 10) {
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

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
  const avaliacaoIdFromState = location?.state?.avaliacaoId || null;
  const avaliacaoDataFromState = location?.state?.avaliacaoData || null;
  const returnToHistorico = location?.state?.returnTo === "historico";
  const allowUpdateCliente = location?.state?.allowUpdateCliente !== false;
  const personName =
    location?.state?.name ||
    (typeof window !== "undefined"
      ? localStorage.getItem("medfit_user_name")
      : "") ||
    "";

  // Estado para dados básicos e medidas
  const [dadosBasicos, setDadosBasicos] = useState({
    idade: clienteDataFromState?.idade || "",
    peso: clienteDataFromState?.peso || "",
  });

  const [dadosPessoais, setDadosPessoais] = useState({
    endereco: clienteDataFromState?.endereco || "",
    bairro: clienteDataFromState?.bairro || "",
    numero: clienteDataFromState?.numero || "",
    cidade: clienteDataFromState?.cidade || "",
    estado: clienteDataFromState?.estado || "",
    telefone: clienteDataFromState?.telefone
      ? formatTelefone(clienteDataFromState.telefone)
      : "",
    cpf: clienteDataFromState?.cpf ? formatCPF(clienteDataFromState.cpf) : "",
    email: clienteDataFromState?.email || "",
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
  const [plano, setPlano] = useState(
    clienteDataFromState?.plano ? clienteDataFromState.plano.toString() : ""
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

  const handleDadosPessoaisChange = (field, value) => {
    setDadosPessoais((prev) => ({
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
      setClienteDocId(
        (prev) => id || prev || clienteIdFromState || data.id || null
      );
      setDadosBasicos({
        idade: data.idade || "",
        peso: data.peso || "",
      });
      setDadosPessoais({
        endereco: data?.endereco || "",
        bairro: data?.bairro || "",
        numero: data?.numero || "",
        cidade: data?.cidade || "",
        estado: data?.estado || "",
        telefone: data?.telefone ? formatTelefone(data.telefone) : "",
        cpf: data?.cpf ? formatCPF(data.cpf) : "",
        email: data?.email || "",
      });
      setPlano(
        data?.plano === 3 || data?.plano === 5 ? data.plano.toString() : ""
      );

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

    const fillFromEvaluation = (avaliacao) => {
      if (!avaliacao) return;
      if (avaliacao.idade !== undefined && avaliacao.idade !== null) {
        setDadosBasicos((prev) => ({ ...prev, idade: String(avaliacao.idade) }));
      }
      if (avaliacao.peso !== undefined && avaliacao.peso !== null) {
        setDadosBasicos((prev) => ({ ...prev, peso: String(avaliacao.peso) }));
      }
      if (avaliacao.medidas) {
        const medidasPreenchidas = createEmptyMedidas();
        Object.keys(medidasPreenchidas).forEach((key) => {
          const valor = avaliacao?.medidas?.[key];
          medidasPreenchidas[key] =
            valor === undefined || valor === null
              ? ""
              : typeof valor === "number"
              ? valor.toString()
              : valor;
        });
        setMedidas(medidasPreenchidas);
      }
    };

    if (clienteDataFromState) {
      fillFromData(clienteDataFromState, clienteIdFromState);
      if (avaliacaoDataFromState) fillFromEvaluation(avaliacaoDataFromState);
      return;
    }

    if (!personName) return;

    const loadClienteData = async () => {
      try {
        const clientesRef = collection(db, "clientes");
        let querySnapshot = await getDocs(
          query(clientesRef, where("nome", "==", personName))
        );

        // Fallback: quando o app salva/exibe "Nome Sobrenome" no storage/navegação
        // mas o Firestore tem campos separados `nome` e `sobrenome`.
        if (querySnapshot.empty && personName.includes(" ")) {
          const [nome, ...rest] = personName.split(" ").filter(Boolean);
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

        if (!querySnapshot.empty) {
          const clienteDoc = querySnapshot.docs[0];
          const clienteData = clienteDoc.data();
          fillFromData(clienteData, clienteDoc.id);
          if (avaliacaoDataFromState) fillFromEvaluation(avaliacaoDataFromState);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      }
    };

    loadClienteData();
  }, [
    clienteDataFromState,
    clienteIdFromState,
    personName,
    avaliacaoDataFromState,
  ]);

  // Função para salvar avaliação
  const handleAtualizar = async () => {
    try {
      // 1. Obter dados do cliente que será atualizado
      let clienteId = clienteDocId;
      let clienteAtual = clienteInfo;

      if (!clienteId || !clienteAtual) {
        const clientesRef = collection(db, "clientes");
        let clientesSnapshot = await getDocs(
          query(clientesRef, where("nome", "==", personName))
        );

        if (clientesSnapshot.empty && personName.includes(" ")) {
          const [nome, ...rest] = personName.split(" ").filter(Boolean);
          const sobrenome = rest.join(" ").trim();
          if (nome && sobrenome) {
            clientesSnapshot = await getDocs(
              query(
                clientesRef,
                where("nome", "==", nome),
                where("sobrenome", "==", sobrenome)
              )
            );
          }
        }

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
        setPlano(
          clienteAtual?.plano === 3 || clienteAtual?.plano === 5
            ? clienteAtual.plano.toString()
            : ""
        );
      } else {
        try {
          const clienteDocRef = doc(db, "clientes", clienteId);
          const snapshot = await getDoc(clienteDocRef);
          if (snapshot.exists()) {
            clienteAtual = snapshot.data();
            setClienteInfo(clienteAtual);
            setPlano(
              clienteAtual?.plano === 3 || clienteAtual?.plano === 5
                ? clienteAtual.plano.toString()
                : ""
            );
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
      const dataAtual = new Date();
      const idadeParaSalvar = dadosBasicos.idade || clienteAtual.idade || "";
      const pesoParaSalvar = dadosBasicos.peso || clienteAtual.peso || "";

      const newEvaluation = {
        clienteId, // Usa o ID do documento do cliente
        clienteNome: personName,
        startDate: dataAtual.toISOString(),
        endDate: dataAtual.toISOString(),
        medidas: medidasNormalizadas,
        evaluationDate: dataAtual.toISOString(),
        idade: idadeParaSalvar,
        peso: pesoParaSalvar,
      };

      // 3. Salvar/atualizar avaliação na coleção 'avaliacoes'
      const isEditing = Boolean(avaliacaoIdFromState);
      if (isEditing) {
        const avaliacaoDocRef = doc(db, "avaliacoes", avaliacaoIdFromState);
        await updateDoc(avaliacaoDocRef, {
          medidas: medidasNormalizadas,
          idade: idadeParaSalvar,
          peso: pesoParaSalvar,
          updatedAt: dataAtual.toISOString(),
        });
      } else {
        const avaliacoesRef = collection(db, "avaliacoes");
        await addDoc(avaliacoesRef, newEvaluation);
      }

      // 4. Atualizar dados do cliente na coleção 'clientes'
      // Usa o ID do documento para atualizar o cliente específico
      if (allowUpdateCliente) {
        const clienteDocRef = doc(db, "clientes", clienteId);
        const clienteAtualizado = {
          ...clienteAtual,
          idade: idadeParaSalvar || clienteAtual.idade,
          peso: pesoParaSalvar || clienteAtual.peso,
          plano:
            plano === "3" || plano === "5"
              ? Number(plano)
              : clienteAtual?.plano ?? null,
          endereco:
            dadosPessoais.endereco?.toString().trim() !== ""
              ? dadosPessoais.endereco.toString().trim()
              : clienteAtual?.endereco ?? null,
          bairro:
            dadosPessoais.bairro?.toString().trim() !== ""
              ? dadosPessoais.bairro.toString().trim()
              : clienteAtual?.bairro ?? null,
          numero:
            dadosPessoais.numero?.toString().trim() !== ""
              ? dadosPessoais.numero.toString().trim()
              : clienteAtual?.numero ?? null,
          cidade:
            dadosPessoais.cidade?.toString().trim() !== ""
              ? dadosPessoais.cidade.toString().trim()
              : clienteAtual?.cidade ?? null,
          estado:
            dadosPessoais.estado?.toString().trim() !== ""
              ? dadosPessoais.estado.toString().trim().toUpperCase()
              : clienteAtual?.estado ?? null,
          telefone:
            dadosPessoais.telefone?.toString().replace(/\D/g, "").trim() !== ""
              ? dadosPessoais.telefone.toString().replace(/\D/g, "").trim()
              : clienteAtual?.telefone ?? null,
          cpf:
            dadosPessoais.cpf?.toString().replace(/\D/g, "").trim() !== ""
              ? dadosPessoais.cpf.toString().replace(/\D/g, "").trim()
              : clienteAtual?.cpf ?? null,
          email:
            dadosPessoais.email?.toString().trim() !== ""
              ? dadosPessoais.email.toString().trim()
              : clienteAtual?.email ?? null,
          medidas: {
            ...clienteAtual.medidas,
            ...medidasNormalizadas,
          },
          dataUltimaAvaliacao: new Date().toISOString(),
        };

        await updateDoc(clienteDocRef, clienteAtualizado);
        setClienteInfo(clienteAtualizado);
      }

      // O localStorage para backup ainda funciona, mas é menos crítico
      if (!avaliacaoIdFromState) {
        const existingEvaluations = JSON.parse(
          localStorage.getItem("medfit_evaluations") || "[]"
        );
        existingEvaluations.push(newEvaluation);
        localStorage.setItem(
          "medfit_evaluations",
          JSON.stringify(existingEvaluations)
        );

        localStorage.setItem(
          "medfit_last_evaluation_date",
          new Date().toLocaleDateString("pt-BR")
        );
      }

      if (returnToHistorico) {
        navigate("/historico", {
          state: { userName: personName, reloadKey: Date.now() },
        });
      } else {
        // Navegar para a tela home com os dados atualizados
        navigate("/home", {
          state: {
            name: personName,
            newEntry: {
              ...medidasNormalizadas,
              idade: idadeParaSalvar || clienteAtual.idade,
              peso: pesoParaSalvar || clienteAtual.peso,
              altura: clienteAtual.altura,
              cintura: medidasNormalizadas.cintura || "",
              quadril: medidasNormalizadas.quadril || "",
            },
          },
        });
      }

      alert(avaliacaoIdFromState ? "Avaliação atualizada com sucesso!" : "Avaliação salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      alert("Erro ao salvar a avaliação. Tente novamente.");
    }
  };

  const isEditing = Boolean(avaliacaoIdFromState);
  const toNumber = (value) => parseFloat((value ?? "").toString().replace(",", "."));
  const imcPrevisto = computeBMI(toNumber(dadosBasicos.peso), toNumber(clienteInfo?.altura));
  const rcqPrevisto = computeRCQ(toNumber(medidas.cintura), toNumber(medidas.quadril));
  const imcCategoria = getBMICategory(imcPrevisto);
  const rcqCategoria = getRCQCategory(rcqPrevisto, clienteInfo?.sexo);

  if (!personName) {
    return (
      <div className="page">
        <div className="panel">
          <div className="empty-state">
            <span className="material-symbols-rounded">assignment</span>
            <h3>Nenhum cliente selecionado</h3>
            <p>Escolha um cliente na lista para registrar uma avaliação.</p>
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

  const campo = (field, label, props = {}) => (
    <div className="field" key={field}>
      <label htmlFor={`av-${field}`}>{label}</label>
      <input
        className="input"
        type="number"
        id={`av-${field}`}
        inputMode="decimal"
        step="0.01"
        min="0"
        value={medidas[field]}
        onChange={(e) => handleMedidaChange(field, e.target.value)}
        {...props}
      />
    </div>
  );

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        <span className="material-symbols-rounded">arrow_back</span>
        Voltar
      </button>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            {isEditing ? "Editando avaliação" : "Nova avaliação"}
          </p>
          <h1 className="page-title avaliacao-nome">{personName}</h1>
          <p className="page-subtitle">
            {isEditing
              ? "Altere os valores e salve para atualizar esta avaliação."
              : "Registre as medidas de hoje. Os dados do cliente são atualizados ao salvar."}
          </p>
        </div>
      </div>

      <div className="avaliacao-layout">
        <div>
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="material-symbols-rounded">person</span>
                Dados básicos
              </h2>
            </div>
            <div className="form-grid cols-3">
              <div className="field">
                <label htmlFor="idade">Idade</label>
                <input
                  className="input"
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
              <div className="field">
                <label htmlFor="peso">
                  Peso <span className="field-unit">(kg)</span>
                </label>
                <input
                  className="input"
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
              <div className="field">
                <label htmlFor="plano">Plano semanal</label>
                <select
                  id="plano"
                  className="input"
                  value={plano}
                  onChange={(e) => setPlano(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="3">3 dias por semana</option>
                  <option value="5">5 dias por semana</option>
                </select>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="material-symbols-rounded">straighten</span>
                Medidas
              </h2>
              <span className="panel-hint">Valores em centímetros</span>
            </div>
            <div className="form-grid">
              {MEDIDAS_CAMPOS.map(({ key, label }) => campo(key, label))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="material-symbols-rounded">contact_mail</span>
                Contato e endereço
              </h2>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="telefone">Telefone</label>
                <input
                  className="input"
                  type="tel"
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  maxLength="15"
                  value={dadosPessoais.telefone}
                  onChange={(e) =>
                    handleDadosPessoaisChange(
                      "telefone",
                      formatTelefone(e.target.value)
                    )
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="cpf">CPF</label>
                <input
                  className="input"
                  type="text"
                  id="cpf"
                  placeholder="000.000.000-00"
                  maxLength="14"
                  value={dadosPessoais.cpf}
                  onChange={(e) =>
                    handleDadosPessoaisChange("cpf", formatCPF(e.target.value))
                  }
                />
              </div>
              <div className="field span-2">
                <label htmlFor="email">Email</label>
                <input
                  className="input"
                  type="email"
                  id="email"
                  placeholder="exemplo@email.com"
                  value={dadosPessoais.email}
                  onChange={(e) =>
                    handleDadosPessoaisChange("email", e.target.value)
                  }
                />
              </div>
              <div className="field span-2">
                <label htmlFor="endereco">Endereço</label>
                <input
                  className="input"
                  type="text"
                  id="endereco"
                  value={dadosPessoais.endereco}
                  onChange={(e) =>
                    handleDadosPessoaisChange("endereco", e.target.value)
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="numero">Número</label>
                <input
                  className="input"
                  type="text"
                  id="numero"
                  value={dadosPessoais.numero}
                  onChange={(e) =>
                    handleDadosPessoaisChange("numero", e.target.value)
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="bairro">Bairro</label>
                <input
                  className="input"
                  type="text"
                  id="bairro"
                  value={dadosPessoais.bairro}
                  onChange={(e) =>
                    handleDadosPessoaisChange("bairro", e.target.value)
                  }
                />
              </div>
              <div className="field span-2">
                <label htmlFor="cidade">Cidade</label>
                <input
                  className="input"
                  type="text"
                  id="cidade"
                  value={dadosPessoais.cidade}
                  onChange={(e) =>
                    handleDadosPessoaisChange("cidade", e.target.value)
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="estado">Estado</label>
                <input
                  className="input"
                  type="text"
                  id="estado"
                  maxLength="2"
                  placeholder="Ex: SP"
                  value={dadosPessoais.estado}
                  onChange={(e) =>
                    handleDadosPessoaisChange("estado", e.target.value)
                  }
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="avaliacao-resumo">
          <div className="panel">
            <h2 className="panel-title">
              <span className="material-symbols-rounded">monitoring</span>
              Resumo
            </h2>

            <div className="resumo-item">
              <p className="stat-label">IMC</p>
              <p className="resumo-valor">{imcPrevisto ?? "-"}</p>
              <p className="resumo-cat">
                {imcCategoria || "Informe o peso (altura do cadastro)"}
              </p>
            </div>

            <div className="resumo-item">
              <p className="stat-label">RCQ</p>
              <p className="resumo-valor">{rcqPrevisto ?? "-"}</p>
              <p className="resumo-cat">
                {rcqCategoria || "Informe cintura e quadril"}
              </p>
            </div>

            <dl className="resumo-dados">
              <div>
                <dt>Altura</dt>
                <dd>{formatAltura(clienteInfo?.altura)}</dd>
              </div>
              <div>
                <dt>Sexo</dt>
                <dd>{clienteInfo?.sexo || "-"}</dd>
              </div>
            </dl>

            <button
              className="btn btn-primary resumo-salvar"
              type="button"
              onClick={handleAtualizar}
            >
              <span className="material-symbols-rounded">check</span>
              {isEditing ? "Atualizar avaliação" : "Salvar avaliação"}
            </button>
            <button
              className="btn btn-outline resumo-salvar"
              type="button"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Avaliacao;
