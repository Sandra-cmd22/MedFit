import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Historico.css";
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
import { formatAltura, MEDIDAS_CAMPOS } from "../utils/indices.js";

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
  const userName =
    location?.state?.userName ||
    localStorage.getItem("medfit_user_name") ||
    "Cliente";
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
      <div className="page">
        <p className="page-subtitle">Carregando histórico...</p>
      </div>
    );
  }

  if (!clienteData) {
    return (
      <div className="page">
        <div className="panel">
          <div className="empty-state">
            <span className="material-symbols-rounded">history</span>
            <h3>Nenhum dado encontrado para este cliente</h3>
            <p>Escolha um cliente na lista para ver o histórico de avaliações.</p>
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

  const rotuloMedida = (key) =>
    MEDIDAS_CAMPOS.find((m) => m.key === key)?.label ||
    key
      .replace(/([A-Z])/g, " $1")
      .trim()
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase());

  const temContato =
    clienteData.endereco || clienteData.bairro || clienteData.numero ||
    clienteData.cidade || clienteData.estado || clienteData.telefone ||
    clienteData.cpf || clienteData.email;

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        <span className="material-symbols-rounded">arrow_back</span>
        Voltar
      </button>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Histórico do cliente</p>
          <h1 className="page-title historico-nome">{clienteData.nome}</h1>
          <p className="page-subtitle">
            Cadastrado em {formatDate(clienteData.dataCadastro)} ·{" "}
            {avaliacoes.length} avaliação(ões)
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={gerarAvaliacaoPDF}
            title="Baixar avaliação em PDF"
          >
            <span className="material-symbols-rounded">picture_as_pdf</span>
            Baixar PDF
          </button>
          <button
            type="button"
            className="btn btn-whatsapp"
            onClick={shareToWhatsApp}
            title="Compartilhar no WhatsApp (última avaliação)"
          >
            <span className="material-symbols-rounded">share</span>
            WhatsApp
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/avaliacao", { state: { name: userName } })}
          >
            <span className="material-symbols-rounded">add</span>
            Nova avaliação
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <p className="stat-label">IMC</p>
          <p className="stat-value">{imc || "-"}</p>
        </div>
        <div className="stat">
          <p className="stat-label">RCQ</p>
          <p className="stat-value">{rcq || "-"}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Peso</p>
          <p className="stat-value">
            {clienteData.peso || "-"}
            {clienteData.peso && <span className="stat-unit">kg</span>}
          </p>
        </div>
        <div className="stat">
          <p className="stat-label">Avaliações</p>
          <p className="stat-value">{avaliacoes.length}</p>
        </div>
      </div>

      <div className="historico-layout">
        <div>
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="material-symbols-rounded">history</span>
                Avaliações
              </h2>
              <span className="panel-hint">Mais recente primeiro · clique para ver todas as medidas</span>
            </div>

            {avaliacoes.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-rounded">assessment</span>
                <h3>Nenhuma avaliação encontrada</h3>
              </div>
            ) : (
              <table className="data-table historico-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th className="num">Idade</th>
                    <th className="num">Peso (kg)</th>
                    <th className="num">Medidas</th>
                    <th className="actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {avaliacoes.map((avaliacao, index) => {
                    const isExpandida = avaliacaoSelecionada === avaliacao.id;
                    const medidasComValor = Object.entries(avaliacao.medidas || {})
                      .filter(([key, valor]) => {
                        void key;
                        return valor && valor !== "" && valor !== "0";
                      });

                    return (
                      <React.Fragment key={avaliacao.id}>
                        <tr
                          className={`historico-row${isExpandida ? " expandida" : ""}`}
                          onClick={() => setAvaliacaoSelecionada(isExpandida ? null : avaliacao.id)}
                        >
                          <td>
                            <span className="historico-data">
                              {formatDate(avaliacao.dataAvaliacao || avaliacao.evaluationDate)}
                            </span>
                            {index === 0 && <span className="badge badge-green">Atual</span>}
                          </td>
                          <td className="num">{avaliacao.idade || "-"}</td>
                          <td className="num">{avaliacao.peso || "-"}</td>
                          <td className="num">{medidasComValor.length}</td>
                          <td className="actions">
                            <button
                              type="button"
                              className="icon-action"
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
                              className="icon-action danger"
                              title="Apagar avaliação"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApagarAvaliacao(avaliacao, index === 0);
                              }}
                            >
                              <span className="material-symbols-rounded">delete</span>
                            </button>
                            <span className={`material-symbols-rounded historico-chevron${isExpandida ? " aberto" : ""}`}>
                              expand_more
                            </span>
                          </td>
                        </tr>
                        {isExpandida && (
                          <tr className="historico-detalhe">
                            <td colSpan="5">
                              {medidasComValor.length === 0 ? (
                                <p className="panel-hint">Nenhuma medida registrada nesta avaliação</p>
                              ) : (
                                <div className="measure-grid">
                                  {medidasComValor.map(([medida, valor]) => (
                                    <div className="measure" key={medida}>
                                      <p className="measure-label">{rotuloMedida(medida)}</p>
                                      <p className="measure-value">{valor} cm</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="material-symbols-rounded">straighten</span>
                Medidas atuais
              </h2>
              <span className="panel-hint">Última avaliação registrada · em cm</span>
            </div>
            <div className="measure-grid">
              {MEDIDAS_CAMPOS.map(({ key, label }) => (
                <div className="measure" key={key}>
                  <p className="measure-label">{label}</p>
                  <p className="measure-value">{medidas[key] || "-"}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="historico-aside">
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="material-symbols-rounded">person</span>
                Dados básicos
              </h2>
            </div>
            <dl className="info-list">
              <div><dt>Idade</dt><dd>{clienteData.idade || "-"} anos</dd></div>
              <div><dt>Altura</dt><dd>{formatAltura(clienteData.altura)}</dd></div>
              <div><dt>Peso</dt><dd>{clienteData.peso || "-"} kg</dd></div>
              <div><dt>Sexo</dt><dd>{clienteData.sexo || "-"}</dd></div>
            </dl>
          </section>

          {temContato && (
            <section className="panel">
              <div className="panel-header">
                <h2 className="panel-title">
                  <span className="material-symbols-rounded">contact_mail</span>
                  Contato e endereço
                </h2>
              </div>
              <dl className="info-list">
                {clienteData.telefone && (
                  <div><dt>Telefone</dt><dd>{formatTelefoneDisplay(clienteData.telefone)}</dd></div>
                )}
                {clienteData.email && (
                  <div><dt>Email</dt><dd>{clienteData.email}</dd></div>
                )}
                {clienteData.cpf && (
                  <div><dt>CPF</dt><dd>{formatCPFDisplay(clienteData.cpf)}</dd></div>
                )}
                {clienteData.endereco && (
                  <div><dt>Endereço</dt><dd>{clienteData.endereco}</dd></div>
                )}
                {clienteData.numero && (
                  <div><dt>Número</dt><dd>{clienteData.numero}</dd></div>
                )}
                {clienteData.bairro && (
                  <div><dt>Bairro</dt><dd>{clienteData.bairro}</dd></div>
                )}
                {clienteData.cidade && (
                  <div><dt>Cidade</dt><dd>{clienteData.cidade}</dd></div>
                )}
                {clienteData.estado && (
                  <div><dt>Estado</dt><dd>{clienteData.estado}</dd></div>
                )}
              </dl>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Historico;
