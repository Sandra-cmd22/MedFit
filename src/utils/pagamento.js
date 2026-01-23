/**
 * Funções utilitárias para cálculo de situação de pagamento
 */

/**
 * Calcula a data de vencimento baseado no último pagamento e tipo de plano
 * @param {Date|string} ultimoPagamento - Data do último pagamento
 * @param {string} tipoPlano - Tipo do plano: "mensal" | "trimestral" | "anual"
 * @returns {Date} Data de vencimento
 */
export function calcularVencimento(ultimoPagamento, tipoPlano = "mensal") {
  const vencimento = new Date(ultimoPagamento);
  vencimento.setHours(0, 0, 0, 0);

  switch (tipoPlano) {
    case "mensal":
      vencimento.setMonth(vencimento.getMonth() + 1);
      break;
    case "trimestral":
      vencimento.setMonth(vencimento.getMonth() + 3);
      break;
    case "anual":
      vencimento.setFullYear(vencimento.getFullYear() + 1);
      break;
    default:
      vencimento.setMonth(vencimento.getMonth() + 1);
  }

  return vencimento;
}

/**
 * Calcula a situação do pagamento (EM DIA ou ATRASADO)
 * REGRA FINAL:
 * - Se NÃO existe pagamento no banco → ATRASADO
 * - Se existe pagamento:
 *    - Hoje <= vencimento → EM DIA
 *    - Hoje > vencimento → ATRASADO
 *
 * @param {Date|string|null} ultimoPagamento
 * @param {string} tipoPlano
 * @returns {string} "EM DIA" | "ATRASADO"
 */
export function calcularSituacao(ultimoPagamento, tipoPlano = "mensal") {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // 🔴 REGRA PRINCIPAL: sem pagamento no banco = ATRASADO
  if (!ultimoPagamento) {
    console.log("⚠️ calcularSituacao: ultimoPagamento é null/undefined");
    return "ATRASADO";
  }

  // Validar se ultimoPagamento é uma data válida
  const dataReferencia = new Date(ultimoPagamento);
  
  if (isNaN(dataReferencia.getTime())) {
    console.error("❌ calcularSituacao: Data inválida:", ultimoPagamento);
    return "ATRASADO";
  }

  dataReferencia.setHours(0, 0, 0, 0);

  const vencimento = calcularVencimento(dataReferencia, tipoPlano);
  vencimento.setHours(0, 0, 0, 0);

  console.log("=".repeat(60));
  console.log("📊 CALCULANDO SITUAÇÃO");
  console.log(`📅 Último pagamento: ${dataReferencia.toLocaleDateString("pt-BR")}`);
  console.log(`📅 Vencimento: ${vencimento.toLocaleDateString("pt-BR")}`);
  console.log(`📅 Hoje: ${hoje.toLocaleDateString("pt-BR")}`);
  console.log(`📅 Tipo plano: ${tipoPlano}`);
  console.log(`📊 Comparação: hoje (${hoje.getTime()}) > vencimento (${vencimento.getTime()}) = ${hoje > vencimento}`);
  
  const situacao = hoje > vencimento ? "ATRASADO" : "EM DIA";
  console.log(`✅ Situação: ${situacao}`);
  console.log("=".repeat(60));

  return situacao;
}

/**
 * Busca o último pagamento de um cliente na coleção de pagamentos
 * @param {string} clienteId
 * @param {Object} deps - Dependências do Firestore
 * @returns {Promise<Date|null>}
 */
export async function buscarUltimoPagamento(
  clienteId,
  { getDocs, collection, query, where, orderBy, db }
) {
  try {
    const pagamentosRef = collection(db, "pagamentos");

    const q = query(
      pagamentosRef,
      where("clienteId", "==", clienteId),
      orderBy("dataPagamento", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`⚠️ Cliente ${clienteId}: Nenhum pagamento encontrado`);
      return null;
    }

    const ultimoPagamentoDoc = snapshot.docs[0].data();
    
    console.log(`✅ Cliente ${clienteId}: Pagamento encontrado:`, {
      dataPagamento: ultimoPagamentoDoc.dataPagamento,
      tipo: typeof ultimoPagamentoDoc.dataPagamento,
      temToDate: ultimoPagamentoDoc.dataPagamento?.toDate ? true : false,
      temSeconds: ultimoPagamentoDoc.dataPagamento?.seconds ? true : false,
    });

    // Conversão segura de data - verificar todos os formatos possíveis
    if (ultimoPagamentoDoc.dataPagamento) {
      let dataPagamento = null;

      // 1. Firebase Timestamp (tem método toDate)
      if (
        ultimoPagamentoDoc.dataPagamento.toDate &&
        typeof ultimoPagamentoDoc.dataPagamento.toDate === "function"
      ) {
        dataPagamento = ultimoPagamentoDoc.dataPagamento.toDate();
        console.log(`📅 Cliente ${clienteId}: Convertido via toDate(): ${dataPagamento.toLocaleDateString("pt-BR")}`);
      }
      // 2. Timestamp com seconds
      else if (ultimoPagamentoDoc.dataPagamento.seconds) {
        dataPagamento = new Date(ultimoPagamentoDoc.dataPagamento.seconds * 1000);
        console.log(`📅 Cliente ${clienteId}: Convertido via seconds: ${dataPagamento.toLocaleDateString("pt-BR")}`);
      }
      // 3. Timestamp com _seconds (formato antigo)
      else if (ultimoPagamentoDoc.dataPagamento._seconds) {
        dataPagamento = new Date(ultimoPagamentoDoc.dataPagamento._seconds * 1000);
        console.log(`📅 Cliente ${clienteId}: Convertido via _seconds: ${dataPagamento.toLocaleDateString("pt-BR")}`);
      }
      // 4. String (ISO ou formato brasileiro)
      else if (typeof ultimoPagamentoDoc.dataPagamento === "string") {
        dataPagamento = new Date(ultimoPagamentoDoc.dataPagamento);
        console.log(`📅 Cliente ${clienteId}: Convertido via string: ${dataPagamento.toLocaleDateString("pt-BR")}`);
      }
      // 5. Date object
      else if (ultimoPagamentoDoc.dataPagamento instanceof Date) {
        dataPagamento = new Date(ultimoPagamentoDoc.dataPagamento);
        console.log(`📅 Cliente ${clienteId}: Já é Date: ${dataPagamento.toLocaleDateString("pt-BR")}`);
      }
      // 6. Tentar converter como último recurso
      else {
        dataPagamento = new Date(ultimoPagamentoDoc.dataPagamento);
        console.log(`📅 Cliente ${clienteId}: Convertido via new Date(): ${dataPagamento.toLocaleDateString("pt-BR")}`);
      }

      // Validar se a data é válida
      if (dataPagamento && !isNaN(dataPagamento.getTime())) {
        return dataPagamento;
      } else {
        console.error(`❌ Cliente ${clienteId}: Data inválida após conversão:`, ultimoPagamentoDoc.dataPagamento);
        return null;
      }
    }

    console.log(`⚠️ Cliente ${clienteId}: Pagamento sem campo dataPagamento`);
    return null;
  } catch (error) {
    console.error(`❌ Erro ao buscar último pagamento para cliente ${clienteId}:`, error);
    return null;
  }
}
