import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Historico.css";
import BottomNav from "../components/BottomNav.jsx";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Historico = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clienteData, setClienteData] = useState(
    location?.state?.clienteData || null
  );
  const [clienteDocId, setClienteDocId] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState(null);
  const userName = location?.state?.userName || "Cliente";
  const reloadKey = location?.state?.reloadKey || 0;

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
          setClienteDocId(clienteDoc.id);
          setClienteData(clienteDoc.data());
        }

        // --- 2. Buscar avaliações do cliente ---
        // Busca por clienteNome E clienteId para garantir que encontre todas as avaliações
        const avaliacoesRef = collection(db, "avaliacoes");
        let avaliacoesCliente = [];
        const avaliacoesIds = new Set(); // Para evitar duplicatas
        
        // Buscar por clienteNome
        try {
          const qAvaliacoesPorNome = query(
            avaliacoesRef,
            where("clienteNome", "==", userName)
          );
          const avaliacoesSnapshotPorNome = await getDocs(qAvaliacoesPorNome);
          avaliacoesSnapshotPorNome.docs.forEach((doc) => {
            const avaliacao = {
              id: doc.id,
              ...doc.data(),
            };
            if (!avaliacoesIds.has(doc.id)) {
              avaliacoesCliente.push(avaliacao);
              avaliacoesIds.add(doc.id);
            }
          });
          console.log("📊 Avaliações encontradas por nome:", avaliacoesSnapshotPorNome.docs.length);
        } catch (error) {
          console.warn("⚠️ Erro ao buscar por nome:", error);
        }
        
        // Buscar por clienteId (se disponível) e adicionar as que ainda não foram encontradas
        if (clienteId) {
          try {
            const qAvaliacoesPorId = query(
              avaliacoesRef,
              where("clienteId", "==", clienteId)
            );
            const avaliacoesSnapshotPorId = await getDocs(qAvaliacoesPorId);
            avaliacoesSnapshotPorId.docs.forEach((doc) => {
              if (!avaliacoesIds.has(doc.id)) {
                const avaliacao = {
                  id: doc.id,
                  ...doc.data(),
                };
                avaliacoesCliente.push(avaliacao);
                avaliacoesIds.add(doc.id);
              }
            });
            console.log("📊 Avaliações encontradas por ID:", avaliacoesSnapshotPorId.docs.length);
          } catch (error2) {
            console.warn("⚠️ Erro ao buscar por ID:", error2);
          }
        }
        
        // Ordenar todas as avaliações por data (mais recente primeiro)
        avaliacoesCliente.sort((a, b) => {
          const dateA = a.evaluationDate || a.startDate || a.endDate || "";
          const dateB = b.evaluationDate || b.startDate || b.endDate || "";
          return new Date(dateB) - new Date(dateA);
        });
        
        console.log("📊 Total de avaliações encontradas (sem duplicatas):", avaliacoesCliente.length);

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

        // Log detalhado das avaliações encontradas
        console.log("=".repeat(60));
        console.log("📊 RESUMO DAS AVALIAÇÕES ENCONTRADAS");
        console.log("=".repeat(60));
        console.log(`Total: ${avaliacoesCliente.length} avaliações`);
        avaliacoesCliente.forEach((av, idx) => {
          console.log(`\n${idx + 1}. Avaliação ID: ${av.id}`);
          console.log(`   Data: ${av.evaluationDate || av.startDate || av.endDate || "N/A"}`);
          console.log(`   ClienteNome: ${av.clienteNome || "N/A"}`);
          console.log(`   ClienteId: ${av.clienteId || "N/A"}`);
          console.log(`   Medidas: ${Object.keys(av.medidas || {}).length} medidas`);
        });
        console.log("=".repeat(60));

        setAvaliacoes(avaliacoesCliente);
        console.log("✅ Avaliações carregadas no estado:", avaliacoesCliente.length);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userName, reloadKey]);

  const handleEditarAvaliacao = (avaliacao, isLatest) => {
    if (!avaliacao?.id) return;
    navigate("/avaliacao", {
      state: {
        name: userName,
        clienteId: clienteDocId,
        clienteData,
        avaliacaoId: avaliacao.id,
        avaliacaoData: avaliacao,
        returnTo: "historico",
        allowUpdateCliente: Boolean(isLatest),
      },
    });
  };

  const handleApagarAvaliacao = async (avaliacao, isLatest) => {
    if (!avaliacao?.id) return;
    const ok = window.confirm("Tem certeza que deseja apagar esta avaliação?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "avaliacoes", avaliacao.id));

      // Se apagou a avaliação mais recente, tenta “recuar” os dados do cliente
      if (isLatest && clienteDocId) {
        const proxima = avaliacoes.length > 1 ? avaliacoes[1] : null;
        if (proxima) {
          const dataRef =
            proxima.evaluationDate || proxima.startDate || proxima.endDate || null;
          await updateDoc(doc(db, "clientes", clienteDocId), {
            medidas: proxima.medidas || {},
            idade: proxima.idade ?? clienteData?.idade ?? null,
            peso: proxima.peso ?? clienteData?.peso ?? null,
            dataUltimaAvaliacao: dataRef,
          });
        }
      }

      // força recarregar lista
      navigate("/historico", { state: { userName, reloadKey: Date.now() } });
    } catch (error) {
      console.error("Erro ao apagar avaliação:", error);
      alert("Não foi possível apagar a avaliação. Tente novamente.");
    }
  };

  // Função auxiliar para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    // Firestore pode retornar timestamps, converta para Date
    if (dateString.toDate) {
      return dateString.toDate().toLocaleDateString("pt-BR");
    }
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch {
      return "-";
    }
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

  const gerarAvaliacaoPDF = () => {
    if (!clienteData) {
      alert("Nenhum dado de cliente disponível para gerar o PDF.");
      return;
    }

    const avaliacaoAtual =
      avaliacoes && avaliacoes.length > 0 ? avaliacoes[0] : null;
    const medidasAtuais =
      (avaliacaoAtual && avaliacaoAtual.medidas) || clienteData.medidas || {};

    let imc = "-";
    if (clienteData.peso && clienteData.altura) {
      const alturaEmMetros =
        clienteData.altura > 3 ? clienteData.altura / 100 : clienteData.altura;
      const imcCalculado = clienteData.peso / (alturaEmMetros * alturaEmMetros);
      imc = Number(imcCalculado.toFixed(1));
    }

    const rcq =
      medidasAtuais.cintura && medidasAtuais.quadril
        ? (medidasAtuais.cintura / medidasAtuais.quadril).toFixed(2)
        : "-";

    try {
      const docPdf = new jsPDF();
      const pageWidth = docPdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      docPdf.setFontSize(20);
      docPdf.setFont("helvetica", "bold");
      docPdf.text("Avaliação Física - MedFit", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 10;

      docPdf.setFontSize(14);
      docPdf.setFont("helvetica", "normal");
      const dataAvaliacao =
        (avaliacaoAtual &&
          (avaliacaoAtual.evaluationDate ||
            avaliacaoAtual.dataAvaliacao ||
            avaliacaoAtual.startDate)) ||
        clienteData.dataCadastro;

      docPdf.text(
        `Cliente: ${clienteData.nome || "-"}`,
        margin,
        yPos
      );
      yPos += 7;
      docPdf.text(
        `Data da avaliação: ${formatDate(dataAvaliacao)}`,
        margin,
        yPos
      );
      yPos += 12;

      docPdf.setFontSize(16);
      docPdf.setFont("helvetica", "bold");
      docPdf.text("Dados Básicos", margin, yPos);
      yPos += 8;

      autoTable(docPdf, {
        startY: yPos,
        head: [["Campo", "Valor"]],
        body: [
          ["Idade", String(clienteData.idade || "-") + " anos"],
          ["Altura", String(clienteData.altura || "-") + " cm"],
          ["Peso", String(clienteData.peso || "-") + " kg"],
          ["Sexo", clienteData.sexo || "-"],
          ["IMC", String(imc)],
          ["RCQ", String(rcq)],
        ],
        theme: "striped",
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: 255,
          fontStyle: "bold",
        },
        bodyStyles: {
          textColor: [0, 0, 0],
        },
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
      });

      yPos = docPdf.lastAutoTable.finalY + 12;

      docPdf.setFontSize(16);
      docPdf.setFont("helvetica", "bold");
      docPdf.text("Medidas Corporais", margin, yPos);
      yPos += 8;

      const entradasMedidas = [
        ["Braço Direito", medidasAtuais.bracoDireito],
        ["Braço Esquerdo", medidasAtuais.bracoEsquerdo],
        ["Braço Força Direito", medidasAtuais.bracoForcaDireito],
        ["Braço Força Esquerdo", medidasAtuais.bracoForcaEsquerdo],
        ["Antebraço Direito", medidasAtuais.antebracoDireito],
        ["Antebraço Esquerdo", medidasAtuais.antebracoEsquerdo],
        ["Tórax", medidasAtuais.torax],
        ["Cintura", medidasAtuais.cintura],
        ["Quadril", medidasAtuais.quadril],
        ["Abdômen", medidasAtuais.abdomen],
        ["Coxa Proximal Direita", medidasAtuais.coxaProximalDireita],
        ["Coxa Proximal Esquerda", medidasAtuais.coxaProximalEsquerda],
        ["Coxa Distal Direita", medidasAtuais.coxaDistalDireita],
        ["Coxa Distal Esquerda", medidasAtuais.coxaDistalEsquerda],
        ["Panturrilha Direita", medidasAtuais.panturrilhaDireita],
        ["Panturrilha Esquerda", medidasAtuais.panturrilhaEsquerda],
      ].map(([label, valor]) => [
        label,
        valor || "-",
        valor ? "cm" : "",
      ]);

      autoTable(docPdf, {
        startY: yPos,
        head: [["Medida", "Valor", "Unidade"]],
        body: entradasMedidas,
        theme: "striped",
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: 255,
          fontStyle: "bold",
        },
        bodyStyles: {
          textColor: [0, 0, 0],
        },
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30, halign: "right" },
          2: { cellWidth: 20, halign: "center" },
        },
      });

      const totalPages = docPdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i += 1) {
        docPdf.setPage(i);
        docPdf.setFontSize(8);
        docPdf.setFont("helvetica", "italic");
        docPdf.text(
          "Gerado pelo MedFit",
          pageWidth / 2,
          docPdf.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      const nomeArquivo = `avaliacao-${(clienteData.nome || "cliente")
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-")}.pdf`;
      docPdf.save(nomeArquivo);
    } catch (error) {
      console.error("Erro ao gerar PDF da avaliação:", error);
      alert("Erro ao gerar o PDF da avaliação. Tente novamente.");
    }
  };

  const shareToWhatsApp = () => {
    if (!clienteData) return;

    // Gera o PDF da avaliação mais recente antes de abrir o WhatsApp
    gerarAvaliacaoPDF();

    const avaliacaoAtual =
      avaliacoes && avaliacoes.length > 0 ? avaliacoes[0] : null;
    const medidas =
      (avaliacaoAtual && avaliacaoAtual.medidas) || clienteData.medidas || {};
    let imc = "-";
    if (clienteData.peso && clienteData.altura) {
      // Converter altura de cm para metros se necessário (se altura > 3, assume que está em cm)
      const alturaEmMetros = clienteData.altura > 3 ? clienteData.altura / 100 : clienteData.altura;
      const imcCalculado = clienteData.peso / (alturaEmMetros * alturaEmMetros);
      imc = Number(imcCalculado.toFixed(1));
    }
    const rcq =
      medidas.cintura && medidas.quadril
        ? (medidas.cintura / medidas.quadril).toFixed(2)
        : "-";

    const dataAvaliacao =
      (avaliacaoAtual &&
        (avaliacaoAtual.evaluationDate ||
          avaliacaoAtual.dataAvaliacao ||
          avaliacaoAtual.startDate)) ||
      clienteData.dataCadastro;

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
📅 *Data:* ${formatDate(dataAvaliacao)}

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
  let imc = null;
  if (clienteData.peso && clienteData.altura) {
    // Converter altura de cm para metros se necessário (se altura > 3, assume que está em cm)
    const alturaEmMetros = clienteData.altura > 3 ? clienteData.altura / 100 : clienteData.altura;
    const imcCalculado = clienteData.peso / (alturaEmMetros * alturaEmMetros);
    imc = Number(imcCalculado.toFixed(1));
  }
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
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="icon-btn"
            onClick={gerarAvaliacaoPDF}
            title="Baixar avaliação em PDF"
          >
            <span className="material-symbols-rounded">description</span>
          </button>
          <button
            className="icon-btn"
            onClick={shareToWhatsApp}
            title="Compartilhar no WhatsApp (última avaliação)"
          >
            <span className="material-symbols-rounded">share</span>
          </button>
        </div>
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
            Corporais Atuais
          </h3>
          <div style={{
            marginBottom: "16px",
            padding: "8px 12px",
            backgroundColor: "#e8f5e9",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#2e7d32",
          }}>
            <span
              className="material-symbols-rounded"
              style={{ fontSize: "16px", marginRight: "4px" }}
            >
              check_circle
            </span>
            Dados atuais do cliente (última avaliação registrada)
          </div>
          <div className="medidas-grid">
            <div className="medida-item">
              <span className="label">Braço Direito:</span>
              <span className="value">{medidas.bracoDireito || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Braço Esquerdo:</span>
              <span className="value">{medidas.bracoEsquerdo || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Braço Força Direito:</span>
              <span className="value">{medidas.bracoForcaDireito || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Braço Força Esquerdo:</span>
              <span className="value">{medidas.bracoForcaEsquerdo || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Antebraço Direito:</span>
              <span className="value">{medidas.antebracoDireito || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Antebraço Esquerdo:</span>
              <span className="value">{medidas.antebracoEsquerdo || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Tórax:</span>
              <span className="value">{medidas.torax || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Cintura:</span>
              <span className="value">{medidas.cintura || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Quadril:</span>
              <span className="value">{medidas.quadril || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Abdômen:</span>
              <span className="value">{medidas.abdomen || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Coxa Proximal Direita:</span>
              <span className="value">{medidas.coxaProximalDireita || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Coxa Proximal Esquerda:</span>
              <span className="value">{medidas.coxaProximalEsquerda || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Coxa Distal Direita:</span>
              <span className="value">{medidas.coxaDistalDireita || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Coxa Distal Esquerda:</span>
              <span className="value">{medidas.coxaDistalEsquerda || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Panturrilha Direita:</span>
              <span className="value">{medidas.panturrilhaDireita || "-"} cm</span>
            </div>
            <div className="medida-item">
              <span className="label">Panturrilha Esquerda:</span>
              <span className="value">{medidas.panturrilhaEsquerda || "-"} cm</span>
            </div>
          </div>
        </div>

        <div className="section">
          <h3>
            <span className="material-symbols-rounded">history</span>{" "}
            Histórico de Avaliações
          </h3>
          {avaliacoes.length > 0 && (
            <div style={{
              marginBottom: "16px",
              padding: "8px 12px",
              backgroundColor: "#fff3cd",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#856404",
            }}>
              <span
                className="material-symbols-rounded"
                style={{ fontSize: "16px", marginRight: "4px" }}
              >
                info
              </span>
              {avaliacoes.length} avaliação(ões) encontrada(s). Ordenadas por data (mais recente primeiro). Clique em cada avaliação para ver os detalhes completos.
            </div>
          )}
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

                const isExpandida = avaliacaoSelecionada === avaliacao.id;
                const medidasComValor = Object.entries(avaliacao.medidas || {})
                  .filter(([key, valor]) => {
                    void key;
                    return valor && valor !== "" && valor !== "0";
                  });

                return (
                  <div 
                    key={avaliacao.id} 
                    className="avaliacao-item"
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: isExpandida ? '2px solid #D70C1C' : '1px solid #e5e7eb'
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
                        <button
                          type="button"
                          className="icon-btn"
                          title="Editar avaliação"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditarAvaliacao(avaliacao, index === 0);
                          }}
                        >
                          <span className="material-symbols-rounded">edit</span>
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          title="Apagar avaliação"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApagarAvaliacao(avaliacao, index === 0);
                          }}
                        >
                          <span className="material-symbols-rounded">delete</span>
                        </button>
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
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#D70C1C' }}>{valor} cm</div>
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
