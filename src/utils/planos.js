/**
 * Estrutura de Planos
 * Centraliza os valores e descrições dos planos
 * IMPORTANTE: O plano é identificado pelo número (3 ou 5)
 */

export const PLANOS = {
  3: {
    descricao: "3 dias por semana",
    valor: 40,
  },
  5: {
    descricao: "5 dias por semana",
    valor: 50,
  },
};

/**
 * Obtém o valor do plano
 * @param {number} plano - Número do plano (3 ou 5)
 * @returns {number} Valor do plano ou 0 se inválido
 */
export function obterValorPlano(plano) {
  const planoNumero = typeof plano === "string" ? Number(plano) : plano;
  return PLANOS[planoNumero]?.valor || 0;
}

/**
 * Obtém a descrição do plano
 * @param {number} plano - Número do plano (3 ou 5)
 * @returns {string} Descrição do plano ou "Não definido"
 */
export function obterDescricaoPlano(plano) {
  const planoNumero = typeof plano === "string" ? Number(plano) : plano;
  return PLANOS[planoNumero]?.descricao || "Não definido";
}

