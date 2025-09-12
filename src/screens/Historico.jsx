import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Historico.css";
import BottomNav from "../components/BottomNav.jsx";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase.config.js";

const Historico = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clienteData, setClienteData] = useState(
    location?.state?.clienteData || null
  );
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const userName = location?.state?.userName || "Cliente";

  console.log(userName);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // --- 1. Buscar dados do cliente ---
        // Cria uma query para buscar o cliente pelo nome na coleção 'clientes'
        const clientesRef = collection(db, "clientes");
        const qCliente = query(clientesRef, where("nome", "==", userName));
        const clienteSnapshot = await getDocs(qCliente);

        if (!clienteSnapshot.empty) {
          const clienteDoc = clienteSnapshot.docs[0];
          setClienteData(clienteDoc.data());
        }

        // --- 2. Buscar avaliações do cliente ---
        // Cria uma query para buscar avaliações do cliente pelo nome na coleção 'avaliacoes'
        // Ordena por 'evaluationDate' em ordem decrescente (mais recente primeiro)
        const avaliacoesRef = collection(db, "avaliacoes");
        const qAvaliacoes = query(
          avaliacoesRef,
          where("clienteNome", "==", userName),
          orderBy("evaluationDate", "desc") // Firebase permite ordenar diretamente na query
        );
        const avaliacoesSnapshot = await getDocs(qAvaliacoes);

        const avaliacoesCliente = avaliacoesSnapshot.docs.map((doc) => ({
          id: doc.id, // É útil manter o ID do documento
          ...doc.data(),
        }));

        setAvaliacoes(avaliacoesCliente);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userName]); // Dependência ajustada para 'userName'

  // Restante do código (formatDate, calcularDiferencas, renderizarValorComComparacao, shareToWhatsApp)
  // ... (Essas funções não precisam de alteração, pois trabalham com os dados já obtidos)
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    // Firestore pode retornar timestamps, converta para Date
    if (dateString.toDate) {
      return dateString.toDate().toLocaleDateString("pt-BR");
    }
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const calcularDiferencas = (avaliacaoAtual, avaliacaoAnterior) => {
    if (!avaliacaoAtual || !avaliacaoAnterior) return {};

    const diferencas = {};
    const medidasAtuais = avaliacaoAtual.medidas || {};
    const medidasAnteriores = avaliacaoAnterior.medidas || {};

    const medidasParaComparar = [
      "bracoDireito",
      "bracoEsquerdo",
      "bracoForcaDireito",
      "bracoForcaEsquerdo",
      "antebracoDireito",
      "antebracoEsquerdo",
      "torax",
      "cintura",
      "quadril",
      "coxaProximalDireita",
      "coxaProximalEsquerda",
      "coxaDistalDireita",
      "coxaDistalEsquerda",
      "panturrilhaDireita",
      "panturrilhaEsquerda",
    ];

    medidasParaComparar.forEach((medida) => {
      const valorAtual = parseFloat(medidasAtuais[medida]);
      const valorAnterior = parseFloat(medidasAnteriores[medida]);

      if (!isNaN(valorAtual) && !isNaN(valorAnterior)) {
        const isMelhoria =
          medida === "cintura"
            ? valorAtual < valorAnterior
            : valorAtual > valorAnterior;

        diferencas[medida] = {
          atual: valorAtual,
          anterior: valorAnterior,
          diferenca: valorAtual - valorAnterior,
          melhoria: isMelhoria,
        };
      }
    });
    return diferencas;
  };

  const renderizarValorComComparacao = (medida, valor) => {
    if (!avaliacoes || avaliacoes.length < 2) {
      return <span className="value">{valor || "-"} cm</span>;
    }

    const diferencas = calcularDiferencas(avaliacoes[0], avaliacoes[1]);
    const diferenca = diferencas[medida];

    if (!diferenca) {
      return <span className="value">{valor || "-"} cm</span>;
    }

    const valorAtual = diferenca.atual;
    const valorAnterior = diferenca.anterior;
    const isMelhoria = diferenca.melhoria;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "14px",
        }}
      >
        <span
          style={{
            color: isMelhoria ? "#4CAF50" : "#F44336",
            fontWeight: "bold",
          }}
        >
          {valorAtual}cm
        </span>
        <span style={{ color: "#666" }}>/</span>
        <span
          style={{
            color: isMelhoria ? "#F44336" : "#4CAF50",
            fontWeight: "bold",
          }}
        >
          {valorAnterior}cm
        </span>
      </div>
    );
  };

  const shareToWhatsApp = () => {
    if (!clienteData) return;

    const medidas = clienteData.medidas || {};
    const imc =
      clienteData.peso && clienteData.altura
        ? (clienteData.peso / Math.pow(clienteData.altura / 100, 2)).toFixed(1)
        : "-";
    const rcq =
      medidas.cintura && medidas.quadril
        ? (medidas.cintura / medidas.quadril).toFixed(2)
        : "-";

    const message = `📊 *RELATÓRIO DE AVALIAÇÃO FÍSICA*
  
👤 *Cliente:* ${clienteData.nome}
📅 *Data:* ${formatDate(clienteData.dataCadastro)}

📏 *DADOS BÁSICOS:*
• Idade: ${clienteData.idade || "-"} anos
• Altura: ${clienteData.altura || "-"} cm
• Peso: ${clienteData.peso || "-"} kg
• Sexo: ${clienteData.sexo || "-"}

📊 *ÍNDICES CORPORAIS:*
• IMC: ${imc}
• RCQ: ${rcq}

📐 *MEDIDAS CORPORAIS:*
• Braço Direito: ${medidas.bracoDireito || "-"} cm
• Braço Esquerdo: ${medidas.bracoEsquerdo || "-"} cm
• Braço Força Direito: ${medidas.bracoForcaDireito || "-"} cm
• Braço Força Esquerdo: ${medidas.bracoForcaEsquerdo || "-"} cm
• Antebraço Direito: ${medidas.antebracoDireito || "-"} cm
• Antebraço Esquerdo: ${medidas.antebracoEsquerdo || "-"} cm
• Tórax: ${medidas.torax || "-"} cm
• Cintura: ${medidas.cintura || "-"} cm
• Quadril: ${medidas.quadril || "-"} cm
• Coxa Proximal Direita: ${medidas.coxaProximalDireita || "-"} cm
• Coxa Proximal Esquerda: ${medidas.coxaProximalEsquerda || "-"} cm
• Coxa Distal Direita: ${medidas.coxaDistalDireita || "-"} cm
• Coxa Distal Esquerda: ${medidas.coxaDistalEsquerda || "-"} cm
• Panturrilha Direita: ${medidas.panturrilhaDireita || "-"} cm
• Panturrilha Esquerda: ${medidas.panturrilhaEsquerda || "-"} cm

📱 *Gerado pelo MedFit App*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="historico-container">
        <div className="historico-header">
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <h1 className="historico-title">Carregando...</h1>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!clienteData) {
    return (
      <div className="historico-container">
        <div className="historico-header">
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <h1 className="historico-title">Histórico</h1>
        </div>
        <div className="no-data">
          <p>Nenhum dado encontrado para este cliente.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const medidas = clienteData.medidas || {};
  const imc =
    clienteData.peso && clienteData.altura
      ? (clienteData.peso / Math.pow(clienteData.altura / 100, 2)).toFixed(1)
      : null;
  const rcq =
    medidas.cintura && medidas.quadril
      ? (medidas.cintura / medidas.quadril).toFixed(2)
      : null;

  return (
    <div className="historico-container">
      <div className="historico-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <h1 className="historico-title">Histórico Completo</h1>
        <button
          className="icon-btn"
          onClick={shareToWhatsApp}
          title="Compartilhar no WhatsApp"
        >
          <span className="material-symbols-rounded">share</span>
        </button>
      </div>

      <div className="historico-content">
        <div className="client-info">
          <h2>{clienteData.nome}</h2>
          <p>Cadastrado em: {formatDate(clienteData.dataCadastro)}</p>
        </div>

        <div className="section">
          <h3>
            <span className="material-symbols-rounded">person</span> Dados
            Básicos
          </h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Idade:</span>
              <span className="value">{clienteData.idade || "-"} anos</span>
            </div>
            <div className="info-item">
              <span className="label">Altura:</span>
              <span className="value">{clienteData.altura || "-"} cm</span>
            </div>
            <div className="info-item">
              <span className="label">Peso:</span>
              <span className="value">{clienteData.peso || "-"} kg</span>
            </div>
            <div className="info-item">
              <span className="label">Sexo:</span>
              <span className="value">{clienteData.sexo || "-"}</span>
            </div>
          </div>
        </div>

        <div className="section">
          <h3>
            <span className="material-symbols-rounded">analytics</span> Índices
            Corporais
          </h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">IMC:</span>
              <span className="value">{imc || "-"}</span>
            </div>
            <div className="info-item">
              <span className="label">RCQ:</span>
              <span className="value">{rcq || "-"}</span>
            </div>
          </div>
        </div>

        <div className="section">
          <h3>
            <span className="material-symbols-rounded">straighten</span> Medidas
            Corporais
          </h3>
          {avaliacoes.length >= 2 && (
            <div
              style={{
                marginBottom: "16px",
                padding: "8px 12px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#666",
              }}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: "16px", marginRight: "4px" }}
              >
                trending_up
              </span>
              Formato:{" "}
              <span style={{ color: "#4CAF50", fontWeight: "bold" }}>
                atual
              </span>{" "}
              /{" "}
              <span style={{ color: "#F44336", fontWeight: "bold" }}>
                anterior
              </span>
            </div>
          )}
          <div className="medidas-grid">
            <div className="medida-item">
              <span className="label">Braço Direito:</span>
              {renderizarValorComComparacao(
                "bracoDireito",
                medidas.bracoDireito
              )}
            </div>
            <div className="medida-item">
              <span className="label">Braço Esquerdo:</span>
              {renderizarValorComComparacao(
                "bracoEsquerdo",
                medidas.bracoEsquerdo
              )}
            </div>
            <div className="medida-item">
              <span className="label">Braço Força Direito:</span>
              {renderizarValorComComparacao(
                "bracoForcaDireito",
                medidas.bracoForcaDireito
              )}
            </div>
            <div className="medida-item">
              <span className="label">Braço Força Esquerdo:</span>
              {renderizarValorComComparacao(
                "bracoForcaEsquerdo",
                medidas.bracoForcaEsquerdo
              )}
            </div>
            <div className="medida-item">
              <span className="label">Antebraço Direito:</span>
              {renderizarValorComComparacao(
                "antebracoDireito",
                medidas.antebracoDireito
              )}
            </div>
            <div className="medida-item">
              <span className="label">Antebraço Esquerdo:</span>
              {renderizarValorComComparacao(
                "antebracoEsquerdo",
                medidas.antebracoEsquerdo
              )}
            </div>
            <div className="medida-item">
              <span className="label">Tórax:</span>
              {renderizarValorComComparacao("torax", medidas.torax)}
            </div>
            <div className="medida-item">
              <span className="label">Cintura:</span>
              {renderizarValorComComparacao("cintura", medidas.cintura)}
            </div>
            <div className="medida-item">
              <span className="label">Quadril:</span>
              {renderizarValorComComparacao("quadril", medidas.quadril)}
            </div>
            <div className="medida-item">
              <span className="label">Coxa Proximal Direita:</span>
              {renderizarValorComComparacao(
                "coxaProximalDireita",
                medidas.coxaProximalDireita
              )}
            </div>
            <div className="medida-item">
              <span className="label">Coxa Proximal Esquerda:</span>
              {renderizarValorComComparacao(
                "coxaProximalEsquerda",
                medidas.coxaProximalEsquerda
              )}
            </div>
            <div className="medida-item">
              <span className="label">Coxa Distal Direita:</span>
              {renderizarValorComComparacao(
                "coxaDistalDireita",
                medidas.coxaDistalDireita
              )}
            </div>
            <div className="medida-item">
              <span className="label">Coxa Distal Esquerda:</span>
              {renderizarValorComComparacao(
                "coxaDistalEsquerda",
                medidas.coxaDistalEsquerda
              )}
            </div>
            <div className="medida-item">
              <span className="label">Panturrilha Direita:</span>
              {renderizarValorComComparacao(
                "panturrilhaDireita",
                medidas.panturrilhaDireita
              )}
            </div>
            <div className="medida-item">
              <span className="label">Panturrilha Esquerda:</span>
              {renderizarValorComComparacao(
                "panturrilhaEsquerda",
                medidas.panturrilhaEsquerda
              )}
            </div>
          </div>
        </div>

        {avaliacoes.length > 0 && (
          <div className="section">
            <h3>
              <span className="material-symbols-rounded">history</span>{" "}
              Histórico de Avaliações
            </h3>
            <div className="avaliacoes-list">
              {avaliacoes.map((avaliacao, index) => (
                <div key={avaliacao.id} className="avaliacao-item">
                  <div className="avaliacao-header">
                    <span className="avaliacao-date">
                      {formatDate(
                        avaliacao.dataAvaliacao || avaliacao.evaluationDate
                      )}
                    </span>
                    {index === 0 && <span className="badge-atual">Atual</span>}
                  </div>
                  <div className="avaliacao-medidas">
                    {Object.entries(avaliacao.medidas || {})
                      .slice(0, 4)
                      .map(([medida, valor]) => (
                        <div key={medida} className="medida-compact">
                          <span className="label-compact">
                            {medida
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                            :
                          </span>
                          <span className="value-compact">{valor} cm</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="share-section">
          <button className="whatsapp-btn" onClick={shareToWhatsApp}>
            <span className="material-symbols-rounded">share</span>
            Compartilhar no WhatsApp
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Historico;
