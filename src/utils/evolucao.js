import { MEDIDAS_CAMPOS } from "./indices.js";

export const MAX_AVALIACOES = 5;
export const SOMA_KEY = "soma";

export const ROTULOS = {
  primeira: "Primeira exibida",
  ultima: "Última avaliação",
  variacao: "Variação",
};

export const OPCOES_MEDIDA = [
  ...MEDIDAS_CAMPOS,
  { key: SOMA_KEY, label: "Soma total das medidas" },
];

export const toNumber = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = parseFloat(String(valor).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const valorDaMedida = (avaliacao, key) => toNumber(avaliacao?.medidas?.[key]);

export const medidasValidas = (avaliacao) =>
  MEDIDAS_CAMPOS.map(({ key }) => key).filter(
    (key) => valorDaMedida(avaliacao, key) !== null
  );

export const opcoesDisponiveis = (cronologicas) =>
  OPCOES_MEDIDA.filter(({ key }) =>
    key === SOMA_KEY
      ? cronologicas.some((av) => medidasValidas(av).length > 0)
      : cronologicas.some((av) => valorDaMedida(av, key) !== null)
  );

/**
 * Monta a série exibida no gráfico (em ordem cronológica, no máximo `max` avaliações).
 * Para a soma total, usa somente as medidas preenchidas em todas as avaliações exibidas,
 * para que cada soma seja calculada sobre o mesmo conjunto de medidas.
 */
export const montarSerie = (cronologicas, key, max = MAX_AVALIACOES) => {
  if (key !== SOMA_KEY) {
    const pontos = cronologicas
      .map((avaliacao) => ({ avaliacao, valor: valorDaMedida(avaliacao, key) }))
      .filter((p) => p.valor !== null)
      .slice(-max);
    return { pontos, medidasSoma: null };
  }

  const janela = cronologicas
    .filter((av) => medidasValidas(av).length > 0)
    .slice(-max);

  const medidasSoma = MEDIDAS_CAMPOS.map(({ key: k }) => k).filter(
    (k) => janela.length > 0 && janela.every((av) => valorDaMedida(av, k) !== null)
  );

  if (medidasSoma.length === 0) {
    return { pontos: [], medidasSoma };
  }

  const pontos = janela.map((avaliacao) => ({
    avaliacao,
    valor: medidasSoma.reduce((total, k) => total + valorDaMedida(avaliacao, k), 0),
  }));

  return { pontos, medidasSoma };
};
