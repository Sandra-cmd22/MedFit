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
  vencimento.setHours(0, 0, 0, 0); // Zerar horas para comparação correta

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
      // Por padrão, considera mensal
      vencimento.setMonth(vencimento.getMonth() + 1);
  }

  return vencimento;
}

/**
 * Calcula a situação do pagamento (EM DIA ou ATRASADO)
 * @param {Date|string|null} ultimoPagamento - Data do último pagamento (null se nunca pagou)
 * @param {string} tipoPlano - Tipo do plano: "mensal" | "trimestral" | "anual"
 * @param {Date|string|null} dataCadastro - Data de cadastro (usado se nunca pagou)
 * @returns {string} "EM DIA" ou "ATRASADO"
 */
export function calcularSituacao(ultimoPagamento, tipoPlano = "mensal", dataCadastro = null) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Se nunca pagou, usar data de cadastro como referência
  let dataReferencia = ultimoPagamento;
  
  if (!dataReferencia) {
    if (dataCadastro) {
      dataReferencia = new Date(dataCadastro);
    } else {
      // Se não tem nenhuma data, considerar como em dia (cliente novo)
      return "EM DIA";
    }
  } else {
    dataReferencia = new Date(dataReferencia);
  }

  dataReferencia.setHours(0, 0, 0, 0);

  const vencimento = calcularVencimento(dataReferencia, tipoPlano);

  // Se hoje é maior que o vencimento, está atrasado
  return hoje > vencimento ? "ATRASADO" : "EM DIA";
}

/**
 * Busca o último pagamento de um cliente na coleção de pagamentos
 * @param {string} clienteId - ID do cliente
 * @param {Function} getDocs - Função do Firestore para buscar documentos
 * @param {Function} collection - Função do Firestore para acessar coleção
 * @param {Function} query - Função do Firestore para criar query
 * @param {Function} where - Função do Firestore para filtrar
 * @param {Function} orderBy - Função do Firestore para ordenar
 * @param {Object} db - Instância do Firestore
 * @returns {Promise<Date|null>} Data do último pagamento ou null
 */
export async function buscarUltimoPagamento(clienteId, { getDocs, collection, query, where, orderBy, db }) {
  try {
    const pagamentosRef = collection(db, "pagamentos");
    const q = query(
      pagamentosRef,
      where("clienteId", "==", clienteId),
      orderBy("dataPagamento", "desc")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    // Pegar o primeiro documento (mais recente)
    const ultimoPagamentoDoc = snapshot.docs[0].data();
    const dataPagamento = ultimoPagamentoDoc.dataPagamento 
      ? new Date(ultimoPagamentoDoc.dataPagamento)
      : (ultimoPagamentoDoc.dataCriacao ? new Date(ultimoPagamentoDoc.dataCriacao) : null);

    return dataPagamento;
  } catch (error) {
    console.error("Erro ao buscar último pagamento:", error);
    return null;
  }
}

