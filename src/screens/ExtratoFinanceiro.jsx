import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc, addDoc, query, where, orderBy, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { db } from "../firebase.js";
import { calcularSituacao, buscarUltimoPagamento } from "../utils/pagamento.js";
import { PLANOS, obterValorPlano, obterDescricaoPlano } from "../utils/planos.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./ExtratoFinanceiro.css";

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(valor);

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Data de início do sistema - quando começou a contar pagamentos
// Para meses anteriores a esta data, não há pagamentos
// Para o mês desta data, conta apenas a partir desta data
// Para meses posteriores, conta o mês completo
const DATA_INICIO_SISTEMA = new Date(2026, 0, 22); // 22/01/2026 (mês 0 = janeiro)

const ExtratoFinanceiro = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [modalPagamento, setModalPagamento] = useState(null); // { clienteId, clienteNome, valor, plano (número), data, formaPagamento }
  const [loadingExtrato, setLoadingExtrato] = useState(false);
  const [competencia, setCompetencia] = useState(() => {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    return `${hoje.getFullYear()}-${mes}`;
  });

  const loadClientes = async () => {
    setLoading(true);
    try {
      const clientesRef = collection(db, "clientes");
      const snapshot = await getDocs(clientesRef);

      // Buscar situação de pagamento para cada cliente
      const data = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const clienteData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          };

          // 📌 SITUAÇÃO DO ALUNO: Baseada no ÚLTIMO PAGAMENTO registrado no banco
          // Busca o pagamento mais recente do cliente (independente do mês)
          const ultimoPagamento = await buscarUltimoPagamento(clienteData.id, {
            getDocs,
            collection,
            query,
            where,
            orderBy,
            db,
          });

          // Calcula se está EM DIA ou ATRASADO baseado no último pagamento
          const situacao = calcularSituacao(
            ultimoPagamento,
            "mensal", // Todos os planos são mensais
            clienteData.ultimoPagamento || clienteData.dataCadastro
          );

          return {
            ...clienteData,
            ultimoPagamento: ultimoPagamento || clienteData.ultimoPagamento,
            situacaoPagamento: situacao,
          };
        })
      );

      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      alert("Não foi possível carregar os clientes. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const competenciaDate = useMemo(() => {
    const [year, month] = competencia.split("-").map(Number);
    if (!year || !month) return new Date();
    return new Date(year, month - 1, 1);
  }, [competencia]);

  const competenciaLabel = useMemo(() => {
    const formatted = competenciaDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    return capitalize(formatted);
  }, [competenciaDate]);

  // Filtrar apenas clientes ativos
  const clientesAtivos = useMemo(() => {
    return clientes.filter((cliente) => cliente.status !== false);
  }, [clientes]);

  // Função auxiliar para converter dataPagamento para Date
  // REGRA: Extrato usa SOMENTE dataPagamento, NÃO usa situação ou vencimento
  const getDateFromPagamento = (pagamento) => {
    if (!pagamento.dataPagamento) {
      console.warn("⚠️ Pagamento sem dataPagamento:", pagamento.id);
      return null;
    }
    
    // Firebase Timestamp (formato correto)
    if (pagamento.dataPagamento.toDate && typeof pagamento.dataPagamento.toDate === 'function') {
      return pagamento.dataPagamento.toDate();
    }
    
    // Timestamp com seconds
    if (pagamento.dataPagamento.seconds) {
      return new Date(pagamento.dataPagamento.seconds * 1000);
    }
    
    // Timestamp com _seconds (formato antigo)
    if (pagamento.dataPagamento._seconds) {
      return new Date(pagamento.dataPagamento._seconds * 1000);
    }
    
    // String ou Date
    if (typeof pagamento.dataPagamento === 'string' || pagamento.dataPagamento instanceof Date) {
      return new Date(pagamento.dataPagamento);
    }
    
    console.warn("⚠️ Formato de data desconhecido:", pagamento.dataPagamento);
    return null;
  };

  // Buscar pagamentos do mês selecionado
  const [pagamentosMes, setPagamentosMes] = useState([]);
  
  useEffect(() => {
    const buscarPagamentosMes = async () => {
      try {
        console.log("=".repeat(60));
        console.log("🔍 EXTRATO FINANCEIRO - BUSCA DE PAGAMENTOS");
        console.log("📌 REGRA: Usa SOMENTE dataPagamento, NÃO usa situação ou vencimento");
        console.log("=".repeat(60));
        
        // Buscar TODOS os pagamentos da coleção "pagamentos"
        const pagamentosRef = collection(db, "pagamentos");
        const snapshot = await getDocs(pagamentosRef);
        
        console.log(`📦 Total de documentos na coleção "pagamentos": ${snapshot.docs.length}`);
        
        // Extrair ano e mês da competência (formato: "2026-01")
        const [ano, mes] = competencia.split("-").map(Number);
        
        console.log(`📅 Competência selecionada: ${competencia}`);
        console.log(`📅 Ano: ${ano}, Mês: ${mes} (janeiro = 1, dezembro = 12)`);
        
        // REGRA: Definir data de início do filtro
        // Se for o mês de início do sistema, usar a data de início
        // Se for mês posterior, usar dia 1 do mês
        const mesSelecionado = new Date(ano, mes - 1, 1);
        const mesInicioSistema = new Date(
          DATA_INICIO_SISTEMA.getFullYear(),
          DATA_INICIO_SISTEMA.getMonth(),
          DATA_INICIO_SISTEMA.getDate()
        );
        
        // Verificar se o mês selecionado é o mesmo mês da data de início
        const mesmoMesInicio = 
          mesSelecionado.getFullYear() === mesInicioSistema.getFullYear() &&
          mesSelecionado.getMonth() === mesInicioSistema.getMonth();
        
        // Data de início do filtro
        const dataInicioFiltro = mesmoMesInicio 
          ? mesInicioSistema // Se for o mês de início, usar a data de início
          : new Date(ano, mes - 1, 1, 0, 0, 0, 0); // Senão, usar dia 1 do mês
        
        // Data de fim do filtro (último dia do mês)
        const dataFimFiltro = new Date(ano, mes, 0, 23, 59, 59, 999);
        
        console.log(`📅 Data de início do sistema: ${DATA_INICIO_SISTEMA.toLocaleDateString("pt-BR")}`);
        console.log(`📅 Mês selecionado: ${mesSelecionado.toLocaleDateString("pt-BR")}`);
        console.log(`📅 É o mês de início? ${mesmoMesInicio ? "SIM" : "NÃO"}`);
        console.log(`📅 Data de início do filtro: ${dataInicioFiltro.toLocaleDateString("pt-BR")}`);
        console.log(`📅 Data de fim do filtro: ${dataFimFiltro.toLocaleDateString("pt-BR")}`);
        
        // Filtrar pagamentos APENAS do período definido
        const pagamentosFiltrados = [];
        const todosPagamentos = [];
        
        snapshot.docs.forEach((docSnapshot, index) => {
          const pagamentoData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          };
          
          // Converter dataPagamento para Date
          const dataPagamento = getDateFromPagamento(pagamentoData);
          
          if (!dataPagamento) {
            console.warn(`⚠️ Pagamento ${index + 1} sem data válida:`, pagamentoData.id);
            todosPagamentos.push({
              ...pagamentoData,
              erro: "Data inválida",
            });
            return;
          }
          
          // Verificar se está no período do filtro
          const dentroPeriodo = dataPagamento >= dataInicioFiltro && dataPagamento <= dataFimFiltro;
          
          todosPagamentos.push({
            ...pagamentoData,
            dataConvertida: dataPagamento,
            mesData: dataPagamento.getMonth() + 1,
            anoData: dataPagamento.getFullYear(),
            dentroPeriodo,
          });
          
          if (dentroPeriodo) {
            pagamentosFiltrados.push(pagamentoData);
            console.log(`✅ Pagamento ${index + 1} INCLUÍDO:`, {
              id: pagamentoData.id,
              clienteId: pagamentoData.clienteId,
              data: dataPagamento.toLocaleDateString("pt-BR"),
              valor: pagamentoData.valor,
            });
          } else {
            console.log(`❌ Pagamento ${index + 1} EXCLUÍDO:`, {
              id: pagamentoData.id,
              data: dataPagamento.toLocaleDateString("pt-BR"),
              motivo: `Fora do período (${dataInicioFiltro.toLocaleDateString("pt-BR")} até ${dataFimFiltro.toLocaleDateString("pt-BR")})`,
            });
          }
        });
        
        console.log("\n" + "=".repeat(60));
        console.log("📊 RESUMO DO EXTRATO");
        console.log("=".repeat(60));
        console.log(`Total de pagamentos no banco: ${snapshot.docs.length}`);
        console.log(`Pagamentos do mês ${competencia}: ${pagamentosFiltrados.length}`);
        console.log(`\n💰 Pagamentos do mês:`, pagamentosFiltrados);
        console.log("=".repeat(60));
        
        setPagamentosMes(pagamentosFiltrados);
      } catch (error) {
        console.error("❌ ERRO ao buscar pagamentos do mês:", error);
        console.error("Stack trace:", error.stack);
        setPagamentosMes([]);
      }
    };

    if (competencia) {
      buscarPagamentosMes();
    }
  }, [competencia]);

  // 📊 EXTRATO FINANCEIRO: Baseado nos pagamentos do MÊS selecionado
  // REGRA: Usa SOMENTE pagamentos com dataPagamento no mês selecionado
  // NÃO usa situação do aluno (EM DIA/ATRASADO)
  // NÃO usa último pagamento
  // NÃO usa vencimento
  const dadosExtrato = useMemo(() => {
    console.log("=".repeat(60));
    console.log("📊 CALCULANDO DADOS DO EXTRATO");
    console.log("📌 REGRA: Extrato = pagamentos do MÊS, NÃO usa situação do aluno");
    console.log("=".repeat(60));
    
    // Total de clientes cadastrados (ativos)
    const totalAlunosCadastrados = clientesAtivos.length;
    console.log(`👥 Total de clientes ativos: ${totalAlunosCadastrados}`);
    console.log(`💳 Total de pagamentos do mês: ${pagamentosMes.length}`);

    // Clientes que pagaram no mês (únicos)
    // REGRA: Apenas clientes que têm pagamento com dataPagamento no mês selecionado
    const clientesQuePagaramIds = new Set(
      pagamentosMes
        .map((p) => p.clienteId)
        .filter(Boolean)
    );
    const alunosPagaram = clientesQuePagaramIds.size;
    
    console.log(`✅ Alunos que pagaram no mês: ${alunosPagaram}`);
    console.log(`👥 IDs: [${Array.from(clientesQuePagaramIds).join(", ")}]`);

    // Alunos sem pagamento registrado no mês
    const alunosSemPagamento = totalAlunosCadastrados - alunosPagaram;
    console.log(`❌ Alunos sem pagamento registrado no mês: ${alunosSemPagamento}`);

    // Faturamento total do mês
    // REGRA: Soma APENAS valores dos pagamentos do mês selecionado
    const faturamentoTotal = pagamentosMes.reduce((acc, p) => {
      const valor = Number(p.valor) || 0;
      return acc + valor;
    }, 0);
    
    console.log(`💵 Faturamento total do mês: R$ ${faturamentoTotal.toFixed(2)}`);
    console.log("=".repeat(60));

    return {
      totalAlunosCadastrados,
      alunosPagaram,
      alunosSemPagamento,
      faturamentoTotal,
      pagamentosMes,
    };
  }, [clientesAtivos, pagamentosMes]);

  const totalMensal = useMemo(() => {
    return clientesAtivos.reduce((acc, cliente) => {
      const planoValor = obterValorPlano(cliente.plano);
      return acc + planoValor;
    }, 0);
  }, [clientesAtivos]);

  // Função para gerar extrato PDF
  const gerarExtratoPDF = async () => {
    setLoadingExtrato(true);

    try {
      // Criar documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // Cabeçalho
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("MedFit", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      doc.setFontSize(18);
      doc.text("EXTRATO FINANCEIRO MENSAL", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 8;

      // Mês/Ano
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(
        competenciaLabel.toUpperCase(),
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
      yPos += 8;

      // Data de geração
      const agora = new Date();
      const dataGeracao = agora.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const horaGeracao = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Gerado em: ${dataGeracao} às ${horaGeracao}`,
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
      yPos += 20;

      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      // Resumo Financeiro
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("RESUMO FINANCEIRO", margin, yPos);
      yPos += 12;

      // Tabela de resumo
      const resumoData = [
        [
          "Total de Alunos Cadastrados",
          dadosExtrato.totalAlunosCadastrados.toString(),
        ],
        [
          "Alunos que Pagaram no Mês",
          dadosExtrato.alunosPagaram.toString(),
        ],
        [
          "Alunos sem pagamento registrado no mês",
          dadosExtrato.alunosSemPagamento.toString(),
        ],
        [
          "Faturamento Total do Mês",
          formatCurrency(dadosExtrato.faturamentoTotal),
        ],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [["Item", "Valor"]],
        body: resumoData,
        theme: "striped",
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: 255,
          fontStyle: "bold",
        },
        bodyStyles: {
          textColor: [0, 0, 0],
        },
        columnStyles: {
          0: { cellWidth: 120, fontStyle: "bold" },
          1: { cellWidth: 60, halign: "right" },
        },
        margin: { left: margin, right: margin },
      });

      yPos = doc.lastAutoTable.finalY + 20;

      // Destaque do Faturamento
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(6, 95, 70); // Verde
      doc.text(
        `FATURAMENTO: ${formatCurrency(dadosExtrato.faturamentoTotal)}`,
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
      yPos += 20;

      // Detalhamento de Pagamentos (se houver)
      if (dadosExtrato.pagamentosMes.length > 0) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("DETALHAMENTO DE PAGAMENTOS", margin, yPos);
        yPos += 12;

        // Buscar nomes dos clientes para o detalhamento
        const detalhesPagamentos = await Promise.all(
          dadosExtrato.pagamentosMes.map(async (pagamento) => {
            const cliente = clientesAtivos.find((c) => c.id === pagamento.clienteId);
            const nomeCliente = cliente
              ? `${cliente.nome}${cliente.sobrenome ? ` ${cliente.sobrenome}` : ""}`
              : "Cliente não encontrado";
            
            // pagamento.plano agora é número (3 ou 5), não mais planoId
            const planoDesc = obterDescricaoPlano(pagamento.plano || pagamento.planoId);
            let dataPag;
            if (pagamento.dataPagamento?.toDate) {
              // Firebase Timestamp
              dataPag = pagamento.dataPagamento.toDate();
            } else if (pagamento.dataPagamento?.seconds) {
              // Timestamp com seconds
              dataPag = new Date(pagamento.dataPagamento.seconds * 1000);
            } else if (pagamento.dataPagamento) {
              // String ou Date
              dataPag = new Date(pagamento.dataPagamento);
            } else {
              dataPag = new Date();
            }
            
            return [
              nomeCliente,
              planoDesc,
              formatCurrency(pagamento.valor),
              dataPag.toLocaleDateString("pt-BR"),
              pagamento.formaPagamento?.toUpperCase() || "N/A",
            ];
          })
        );

        autoTable(doc, {
          startY: yPos,
          head: [["Cliente", "Plano", "Valor", "Data", "Forma"]],
          body: detalhesPagamentos,
          theme: "striped",
          headStyles: {
            fillColor: [0, 0, 0],
            textColor: 255,
            fontStyle: "bold",
          },
          bodyStyles: {
            textColor: [0, 0, 0],
            fontSize: 9,
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30, halign: "right" },
            3: { cellWidth: 30 },
            4: { cellWidth: 20 },
          },
          margin: { left: margin, right: margin },
        });
      }

      // Rodapé
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Salvar PDF
      const nomeArquivo = `extrato-financeiro-${competencia.replace("-", "_")}.pdf`;
      doc.save(nomeArquivo);

      setLoadingExtrato(false);
      alert("Extrato financeiro gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar extrato:", error);
      alert("Erro ao gerar o extrato. Tente novamente.");
      setLoadingExtrato(false);
    }
  };

  const handlePlanoChange = async (clienteId, novoPlano) => {
    const planoNumero = Number(novoPlano);
    if (![3, 5].includes(planoNumero)) return;

    setUpdatingId(clienteId);
    try {
      const clienteRef = doc(db, "clientes", clienteId);
      await updateDoc(clienteRef, { plano: planoNumero });
      setClientes((prev) =>
        prev.map((cliente) =>
          cliente.id === clienteId ? { ...cliente, plano: planoNumero } : cliente
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      alert("Não foi possível atualizar o plano. Tente novamente.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Abrir modal de confirmação de pagamento
  const handleAbrirModalPagamento = (cliente) => {
    const hoje = new Date();
    const planoNumero = cliente?.plano; // 3 ou 5
    const valor = PLANOS[planoNumero]?.valor || 0;
    const planoDescricao = obterDescricaoPlano(planoNumero);
    const nomeCompleto = `${cliente.nome}${cliente.sobrenome ? ` ${cliente.sobrenome}` : ""}`;

    // Debug: verificar cálculo do valor
    console.log("=".repeat(60));
    console.log("💰 CALCULANDO VALOR DO PAGAMENTO");
    console.log("=".repeat(60));
    console.log("Cliente:", nomeCompleto);
    console.log("Plano do cliente (número):", planoNumero);
    console.log("Tipo do plano:", typeof planoNumero);
    console.log("Valor do plano:", valor);
    console.log("Descrição do plano:", planoDescricao);
    console.log("=".repeat(60));

    setModalPagamento({
      clienteId: cliente.id,
      clienteNome: nomeCompleto,
      valor,
      plano: planoNumero, // Salvar como número (3 ou 5)
      planoDescricao,
      data: hoje.toLocaleDateString("pt-BR"),
      formaPagamento: "pix", // padrão
    });
  };

  // Confirmar e registrar pagamento
  const handleConfirmarPagamento = async () => {
    if (!modalPagamento || !modalPagamento.plano) {
      alert("Plano não selecionado. Por favor, selecione um plano primeiro.");
      return;
    }

    try {
      const planoNumero = modalPagamento.plano; // 3 ou 5
      
      // Validar se o plano existe
      if (!PLANOS[planoNumero]) {
        alert("Plano inválido. Por favor, selecione um plano válido.");
        return;
      }

      // Obter valor diretamente do PLANOS
      const valor = PLANOS[planoNumero].valor;
      
      // Validação de segurança: garantir que o valor está correto
      if (modalPagamento.valor !== valor) {
        console.warn("⚠️ VALOR INCONSISTENTE! Corrigindo...");
        console.warn(`Valor do modal (${modalPagamento.valor}) ≠ Valor do plano (${valor})`);
      }
      
      const agora = new Date();
      const mesAtual = String(agora.getMonth() + 1).padStart(2, "0");
      const anoAtual = agora.getFullYear();
      const mesReferencia = `${anoAtual}-${mesAtual}`;

      // 🔒 VALIDAÇÃO: Verificar se o cliente já pagou neste mês
      console.log("=".repeat(60));
      console.log("🔍 VERIFICANDO PAGAMENTOS EXISTENTES");
      console.log("=".repeat(60));
      console.log("Cliente:", modalPagamento.clienteNome);
      console.log("ClienteId:", modalPagamento.clienteId);
      console.log("Mês de referência:", mesReferencia);
      
      const pagamentosRef = collection(db, "pagamentos");
      
      // Buscar pagamentos do cliente no mês atual
      const q = query(
        pagamentosRef,
        where("clienteId", "==", modalPagamento.clienteId),
        where("mesReferencia", "==", mesReferencia)
      );
      
      const snapshot = await getDocs(q);
      const pagamentosExistentes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`📊 Pagamentos encontrados para ${modalPagamento.clienteNome} em ${mesReferencia}:`, pagamentosExistentes.length);
      
      if (pagamentosExistentes.length > 0) {
        const primeiroPagamento = pagamentosExistentes[0];
        const dataPagamento = primeiroPagamento.dataPagamento?.toDate 
          ? primeiroPagamento.dataPagamento.toDate()
          : new Date(primeiroPagamento.dataPagamento);
        
        console.warn("⚠️ PAGAMENTO JÁ EXISTE!");
        console.warn("Data do pagamento existente:", dataPagamento.toLocaleDateString("pt-BR"));
        console.warn("Valor do pagamento existente:", primeiroPagamento.valor);
        
        alert(
          `⚠️ Este aluno já possui um pagamento registrado para ${mesReferencia}!\n\n` +
          `Data: ${dataPagamento.toLocaleDateString("pt-BR")}\n` +
          `Valor: ${formatCurrency(primeiroPagamento.valor)}\n\n` +
          `Cada aluno pode pagar apenas uma vez por mês.`
        );
        return;
      }
      
      console.log("✅ Nenhum pagamento encontrado. Prosseguindo com o registro...");
      console.log("=".repeat(60));
      
      console.log("=".repeat(60));
      console.log("💾 SALVANDO PAGAMENTO");
      console.log("=".repeat(60));
      console.log("Cliente:", modalPagamento.clienteNome);
      console.log("Plano (número):", planoNumero);
      console.log("Valor do plano:", valor);
      console.log("=".repeat(60));

      // Criar documento de pagamento na coleção "pagamentos"
      // Modelo correto: clienteId, plano (número), valor, dataPagamento (Timestamp), mesReferencia, formaPagamento
      const pagamento = {
        clienteId: modalPagamento.clienteId,
        plano: planoNumero, // Salvar como número (3 ou 5)
        valor: valor, // Valor direto de PLANOS[planoNumero].valor
        dataPagamento: Timestamp.now(), // Data e horário exatos do momento do pagamento
        mesReferencia: mesReferencia, // "2026-01"
        formaPagamento: modalPagamento.formaPagamento || "pix",
      };

      // Validação final: garantir que o valor corresponde ao plano
      if (pagamento.valor !== PLANOS[pagamento.plano].valor) {
        throw new Error("Valor do pagamento não corresponde ao plano");
      }

      console.log("📄 Documento de pagamento a ser salvo:", pagamento);

      const docRef = await addDoc(pagamentosRef, pagamento);
      
      console.log("✅ Pagamento salvo com sucesso! ID:", docRef.id);
      console.log("=".repeat(60));

      // Fechar modal
      setModalPagamento(null);

      // Recarregar clientes para atualizar situação
      await loadClientes();

      alert("Pagamento registrado com sucesso!");
    } catch (error) {
      console.error("❌ ERRO ao marcar pagamento:", error);
      console.error("Stack trace:", error.stack);
      alert("Não foi possível registrar o pagamento. Tente novamente.");
    }
  };

  return (
    <div className="extrato-container">
      <header className="extrato-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <span
            className="material-symbols-rounded"
            style={{ fontVariationSettings: '"wght" 300' }}
          >
            arrow_back
          </span>
        </button>
        <div className="extrato-header-text">
          <h1>Extrato Financeiro</h1>
          <p>Resumo das mensalidades por cliente</p>
        </div>
        <button className="icon-btn" onClick={loadClientes} disabled={loading}>
          <span
            className="material-symbols-rounded"
            style={{ fontVariationSettings: '"wght" 300' }}
          >
            refresh
          </span>
        </button>
      </header>

      <section className="extrato-filter">
        <div className="extrato-filter-header">
          <div>
            <p className="extrato-label">Mês de referência</p>
            <strong>{competenciaLabel}</strong>
          </div>
          <div className="extrato-filter-control">
            <span
              className="material-symbols-rounded"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              calendar_month
            </span>
            <input
              type="month"
              id="competencia"
              value={competencia}
              onChange={(event) => setCompetencia(event.target.value)}
            />
          </div>
        </div>
        <p className="extrato-filter-hint">
          Escolha o mês para visualizar o total esperado.
        </p>
      </section>

      <section className="extrato-list">
        {loading ? (
          <div className="extrato-state">Carregando clientes...</div>
        ) : clientesAtivos.length === 0 ? (
          <div className="extrato-state">Nenhum cliente ativo encontrado.</div>
        ) : (
          clientesAtivos.map((cliente) => {
            const nomeCompleto = `${cliente.nome}${
              cliente.sobrenome ? ` ${cliente.sobrenome}` : ""
            }`;
            const planoSelecionado =
              cliente.plano === 3 || cliente.plano === 5
                ? cliente.plano.toString()
                : "";
            const mensalidade = obterValorPlano(cliente.plano);

            return (
              <article key={cliente.id} className="extrato-card">
                <div className="extrato-card-header">
                  <div>
                    <p className="extrato-label">Nome do Cliente</p>
                    <h2>{nomeCompleto}</h2>
                  </div>
                  <div className="extrato-mensalidade">
                    <p className="extrato-label">Mensalidade</p>
                    <strong>{formatCurrency(mensalidade)}</strong>
                  </div>
                </div>

                <div className="extrato-card-body">
                  <div className="extrato-plano">
                    <p className="extrato-label">Plano</p>
                    <select
                      value={planoSelecionado}
                      className="extrato-select"
                      onChange={(event) =>
                        handlePlanoChange(cliente.id, event.target.value)
                      }
                      disabled={updatingId === cliente.id}
                    >
                      <option value="">Selecione</option>
                      <option value="3">3 dias por semana</option>
                      <option value="5">5 dias por semana</option>
                    </select>
                  </div>
                  <p className="extrato-plano-descricao">
                    {planoSelecionado
                      ? obterDescricaoPlano(cliente.plano)
                      : "Defina o plano para calcular a mensalidade."}
                  </p>

                  <div className="extrato-status-pagamento">
                    <span className={`status-badge ${
                      cliente.situacaoPagamento === "ATRASADO" ? "status-atrasado" : "status-em-dia"
                    }`}>
                      {cliente.situacaoPagamento === "ATRASADO" ? "⚠ Atrasado" : "✓ Em dia"}
                    </span>
                  </div>

                  <div className="extrato-acoes-pagamento">
                    <button
                      className="btn-marcar-pago"
                      onClick={() => handleAbrirModalPagamento(cliente)}
                      disabled={loading || !planoSelecionado}
                    >
                      <span className="material-symbols-rounded">check_circle</span>
                      Marcar como Pago
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <div className="extrato-resumo-card">
        <div className="extrato-resumo-item">
          <span className="extrato-resumo-label">Total de Alunos:</span>
          <strong>{dadosExtrato.totalAlunosCadastrados}</strong>
        </div>
        <div className="extrato-resumo-item">
          <span className="extrato-resumo-label">Alunos que Pagaram:</span>
          <strong style={{ color: "#065F46" }}>{dadosExtrato.alunosPagaram}</strong>
        </div>
        <div className="extrato-resumo-item">
          <span className="extrato-resumo-label">Alunos sem pagamento registrado no mês:</span>
          <strong style={{ color: "#991B1B" }}>{dadosExtrato.alunosSemPagamento}</strong>
        </div>
        <div className="extrato-resumo-item">
          <span className="extrato-resumo-label">Faturamento do Mês:</span>
          <strong style={{ color: "#065F46", fontSize: "20px" }}>
            {formatCurrency(dadosExtrato.faturamentoTotal)}
          </strong>
        </div>
      </div>

      <button
        className="btn-gerar-extrato"
        onClick={() => gerarExtratoPDF()}
        disabled={loadingExtrato || loading}
      >
        <span className="material-symbols-rounded">description</span>
        {loadingExtrato ? "Gerando PDF..." : "Gerar Extrato PDF"}
      </button>

      {/* Modal de Confirmação de Pagamento */}
      {modalPagamento && (
        <div className="modal-overlay-pagamento" onClick={() => setModalPagamento(null)}>
          <div className="modal-content-pagamento" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pagamento">
              <h2 className="modal-title-pagamento">Confirmar Pagamento</h2>
              <button 
                className="modal-close-btn-pagamento" 
                onClick={() => setModalPagamento(null)}
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="modal-body-pagamento">
              <div className="modal-info-item">
                <span className="modal-info-label">Cliente:</span>
                <span className="modal-info-value">{modalPagamento.clienteNome}</span>
              </div>

              <div className="modal-info-item">
                <span className="modal-info-label">Data:</span>
                <span className="modal-info-value">{modalPagamento.data}</span>
              </div>

              <div className="modal-info-item">
                <span className="modal-info-label">Plano:</span>
                <span className="modal-info-value">{modalPagamento.planoDescricao}</span>
              </div>

              <div className="modal-info-item">
                <span className="modal-info-label">Forma de Pagamento:</span>
                <select
                  className="modal-select-pagamento"
                  value={modalPagamento.formaPagamento || "pix"}
                  onChange={(e) =>
                    setModalPagamento({
                      ...modalPagamento,
                      formaPagamento: e.target.value,
                    })
                  }
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                </select>
              </div>

              <div className="modal-info-item modal-info-item-valor">
                <span className="modal-info-label">Valor:</span>
                <span className="modal-info-value-valor">{formatCurrency(modalPagamento.valor)}</span>
              </div>
            </div>

            <div className="modal-actions-pagamento">
              <button
                className="btn-confirmar-pagamento"
                onClick={handleConfirmarPagamento}
              >
                <span className="material-symbols-rounded">check_circle</span>
                Confirmar Pagamento
              </button>
              <button
                className="btn-cancelar-pagamento"
                onClick={() => setModalPagamento(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão para ir ao final da página */}
      <button
        className="btn-scroll-to-bottom"
        onClick={() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
          });
        }}
        title="Ir para o final"
      >
        <span className="material-symbols-rounded">keyboard_arrow_down</span>
      </button>

      <BottomNav />
    </div>
  );
};

export default ExtratoFinanceiro;

