import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Historico.css";
import BottomNav from "../components/BottomNav.jsx";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase.js";

const Historico = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clienteData, setClienteData] = useState(
    location?.state?.clienteData || null
  );
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState(null);
  const [mostrarTodasAvaliacoes, setMostrarTodasAvaliacoes] = useState(false);
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

        let clienteId = null;
        if (!clienteSnapshot.empty) {
          const clienteDoc = clienteSnapshot.docs[0];
          clienteId = clienteDoc.id;
          setClienteData(clienteDoc.data());
        }

        // --- 2. Buscar avaliações do cliente ---
        // Tenta buscar por clienteNome primeiro, depois por clienteId como fallback
        const avaliacoesRef = collection(db, "avaliacoes");
        let avaliacoesCliente = [];
        
        try {
          // Tentativa 1: Buscar por clienteNome
          const qAvaliacoesPorNome = query(
            avaliacoesRef,
            where("clienteNome", "==", userName),
            orderBy("evaluationDate", "desc")
          );
          const avaliacoesSnapshotPorNome = await getDocs(qAvaliacoesPorNome);
          avaliacoesCliente = avaliacoesSnapshotPorNome.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("📊 Avaliações encontradas por nome:", avaliacoesCliente.length);
        } catch (error) {
          console.warn("⚠️ Erro ao buscar por nome, tentando por ID:", error);
          
          // Tentativa 2: Buscar por clienteId (se disponível)
          if (clienteId) {
            try {
              const qAvaliacoesPorId = query(
                avaliacoesRef,
                where("clienteId", "==", clienteId),
                orderBy("evaluationDate", "desc")
              );
              const avaliacoesSnapshotPorId = await getDocs(qAvaliacoesPorId);
              avaliacoesCliente = avaliacoesSnapshotPorId.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              console.log("📊 Avaliações encontradas por ID:", avaliacoesCliente.length);
            } catch (error2) {
              console.warn("⚠️ Erro ao buscar por ID:", error2);
            }
          }
        }

        // Se ainda não encontrou, buscar TODAS as avaliações para debug
        if (avaliacoesCliente.length === 0) {
          console.log("🔍 Nenhuma avaliação encontrada. Buscando todas para debug...");
          const todasAvaliacoesSnapshot = await getDocs(avaliacoesRef);
          const todasAvaliacoes = todasAvaliacoesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("📋 Total de avaliações no banco:", todasAvaliacoes.length);
          console.log("📋 Exemplo de avaliação:", todasAvaliacoes[0]);
          console.log("📋 ClienteNome buscado:", userName);
          console.log("📋 ClienteId buscado:", clienteId);
          if (todasAvaliacoes.length > 0) {
            console.log("📋 Nomes de clientes nas avaliações:", todasAvaliacoes.map(a => a.clienteNome || a.clienteId));
          }
        }

        setAvaliacoes(avaliacoesCliente);
        console.log("✅ Avaliações carregadas:", avaliacoesCliente.length, avaliacoesCliente);
      } catch (error) {
        console.error("❌ Erro ao carregar dados:", error);
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

  // Funções para formatar telefone e CPF para exibição
  const formatTelefoneDisplay = (telefone) => {
    if (!telefone) return "-";
    const numbers = telefone.replace(/\D/g, "");
    if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return telefone;
  };

  const formatCPFDisplay = (cpf) => {
    if (!cpf) return "-";
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    }
    return cpf;
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
      "abdomen",
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
          medida === "cintura" || medida === "abdomen"
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

    // Montar informações de contato e endereço
    const enderecoCompleto = [];
    if (clienteData.endereco) enderecoCompleto.push(clienteData.endereco);
    if (clienteData.numero) enderecoCompleto.push(`Nº ${clienteData.numero}`);
    if (clienteData.bairro) enderecoCompleto.push(clienteData.bairro);
    if (clienteData.cidade) enderecoCompleto.push(clienteData.cidade);
    if (clienteData.estado) enderecoCompleto.push(clienteData.estado);
    const enderecoFormatado = enderecoCompleto.length > 0 ? enderecoCompleto.join(", ") : "-";

    const message = `📊 *RELATÓRIO DE AVALIAÇÃO FÍSICA*
  
👤 *Cliente:* ${clienteData.nome}
📅 *Data:* ${formatDate(clienteData.dataCadastro)}

📏 *DADOS BÁSICOS:*
• Idade: ${clienteData.idade || "-"} anos
• Altura: ${clienteData.altura || "-"} cm
• Peso: ${clienteData.peso || "-"} kg
• Sexo: ${clienteData.sexo || "-"}

${(clienteData.endereco || clienteData.bairro || clienteData.numero || 
   clienteData.cidade || clienteData.estado || clienteData.telefone || 
   clienteData.cpf || clienteData.email) ? `📍 *CONTATO E ENDEREÇO:*
${clienteData.endereco || clienteData.bairro || clienteData.numero || clienteData.cidade || clienteData.estado ? `• Endereço: ${enderecoFormatado}` : ""}
${clienteData.telefone ? `• Telefone: ${formatTelefoneDisplay(clienteData.telefone)}` : ""}
${clienteData.cpf ? `• CPF: ${formatCPFDisplay(clienteData.cpf)}` : ""}
${clienteData.email ? `• Email: ${clienteData.email}` : ""}

` : ""}📊 *ÍNDICES CORPORAIS:*
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
• Abdômen: ${medidas.abdomen || "-"} cm
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

        {(clienteData.endereco || clienteData.bairro || clienteData.numero || 
          clienteData.cidade || clienteData.estado || clienteData.telefone || 
          clienteData.cpf || clienteData.email) && (
          <div className="section">
            <h3>
              <span className="material-symbols-rounded">contact_mail</span>{" "}
              Contato e Endereço
            </h3>
            <div className="info-grid">
              {clienteData.endereco && (
                <div className="info-item">
                  <span className="label">Endereço:</span>
                  <span className="value">{clienteData.endereco}</span>
                </div>
              )}
              {clienteData.bairro && (
                <div className="info-item">
                  <span className="label">Bairro:</span>
                  <span className="value">{clienteData.bairro}</span>
                </div>
              )}
              {clienteData.numero && (
                <div className="info-item">
                  <span className="label">Número:</span>
                  <span className="value">{clienteData.numero}</span>
                </div>
              )}
              {clienteData.cidade && (
                <div className="info-item">
                  <span className="label">Cidade:</span>
                  <span className="value">{clienteData.cidade}</span>
                </div>
              )}
              {clienteData.estado && (
                <div className="info-item">
                  <span className="label">Estado:</span>
                  <span className="value">{clienteData.estado}</span>
                </div>
              )}
              {clienteData.telefone && (
                <div className="info-item">
                  <span className="label">Telefone:</span>
                  <span className="value">{formatTelefoneDisplay(clienteData.telefone)}</span>
                </div>
              )}
              {clienteData.cpf && (
                <div className="info-item">
                  <span className="label">CPF:</span>
                  <span className="value">{formatCPFDisplay(clienteData.cpf)}</span>
                </div>
              )}
              {clienteData.email && (
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{clienteData.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

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
              <span className="label">Abdômen:</span>
              {renderizarValorComComparacao("abdomen", medidas.abdomen)}
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

        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3>
              <span className="material-symbols-rounded">history</span>{" "}
              Histórico de Avaliações
            </h3>
            {avaliacoes.length > 0 && (
              <button
                onClick={() => setMostrarTodasAvaliacoes(!mostrarTodasAvaliacoes)}
                style={{
                  background: '#0c4a6e',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(12, 74, 110, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#0a3d5a';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(12, 74, 110, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#0c4a6e';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(12, 74, 110, 0.2)';
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
                  {mostrarTodasAvaliacoes ? 'expand_less' : 'expand_more'}
                </span>
                {mostrarTodasAvaliacoes ? 'Ocultar' : 'Ver'} Avaliações Antigas ({avaliacoes.length})
              </button>
            )}
          </div>
          {avaliacoes.length === 0 && !loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: '#999',
              fontSize: '14px'
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: '48px', display: 'block', marginBottom: '12px', opacity: 0.5 }}>
                assessment
              </span>
              Nenhuma avaliação encontrada
            </div>
          )}
          {avaliacoes.length > 0 && (
            <div className="avaliacoes-list">
              {avaliacoes.map((avaliacao, index) => {
                // Se não está expandido, mostrar apenas as 3 mais recentes
                if (!mostrarTodasAvaliacoes && index >= 3) {
                  return null;
                }

                const isExpandida = avaliacaoSelecionada === avaliacao.id;
                const medidasComValor = Object.entries(avaliacao.medidas || {})
                  .filter(([_, valor]) => valor && valor !== "" && valor !== "0");

                return (
                  <div 
                    key={avaliacao.id} 
                    className="avaliacao-item"
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: isExpandida ? '2px solid #0c4a6e' : '1px solid #e5e7eb'
                    }}
                    onClick={() => setAvaliacaoSelecionada(isExpandida ? null : avaliacao.id)}
                  >
                    <div className="avaliacao-header">
                      <span className="avaliacao-date">
                        {formatDate(
                          avaliacao.dataAvaliacao || avaliacao.evaluationDate
                        )}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {index === 0 && <span className="badge-atual">Atual</span>}
                        <span className="material-symbols-rounded" style={{ 
                          fontSize: '18px', 
                          color: '#666',
                          transform: isExpandida ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}>
                          expand_more
                        </span>
                      </div>
                    </div>
                    
                    {isExpandida ? (
                      // Visualização expandida com todas as medidas
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                        {(avaliacao.idade || avaliacao.peso) && (
                          <div style={{ marginBottom: '12px', padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                            {avaliacao.idade && <div style={{ fontSize: '13px', color: '#666' }}>Idade: <strong>{avaliacao.idade} anos</strong></div>}
                            {avaliacao.peso && <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Peso: <strong>{avaliacao.peso} kg</strong></div>}
                          </div>
                        )}
                        <div className="medidas-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                          {medidasComValor.map(([medida, valor]) => {
                            const nomeMedida = medida
                              .replace(/([A-Z])/g, " $1")
                              .trim()
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(' ');
                            
                            return (
                              <div key={medida} style={{
                                padding: '8px',
                                background: '#f8f9fa',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb'
                              }}>
                                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>{nomeMedida}</div>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#0c4a6e' }}>{valor} cm</div>
                              </div>
                            );
                          })}
                        </div>
                        {medidasComValor.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '14px' }}>
                            Nenhuma medida registrada nesta avaliação
                          </div>
                        )}
                      </div>
                    ) : (
                      // Visualização compacta (apenas algumas medidas)
                      <div className="avaliacao-medidas">
                        {medidasComValor.slice(0, 4).map(([medida, valor]) => (
                          <div key={medida} className="medida-compact">
                            <span className="label-compact">
                              {medida
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())
                                .split(' ')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                .join(' ')}
                              :
                            </span>
                            <span className="value-compact">{valor} cm</span>
                          </div>
                        ))}
                        {medidasComValor.length > 4 && (
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
                            +{medidasComValor.length - 4} medidas (clique para ver todas)
                          </div>
                        )}
                        {medidasComValor.length === 0 && (
                          <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                            Clique para ver detalhes
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {!mostrarTodasAvaliacoes && avaliacoes.length > 3 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '16px', 
                  color: '#666', 
                  fontSize: '13px',
                  fontStyle: 'italic',
                  borderTop: '1px solid #e5e7eb',
                  marginTop: '12px'
                }}>
                  ... e mais {avaliacoes.length - 3} avaliações anteriores
                  <br />
                  <button
                    onClick={() => setMostrarTodasAvaliacoes(true)}
                    style={{
                      marginTop: '8px',
                      background: 'transparent',
                      border: '1px solid #0c4a6e',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: '#0c4a6e',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Ver todas as avaliações
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
