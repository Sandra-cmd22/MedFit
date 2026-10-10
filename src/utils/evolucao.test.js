import { test } from "node:test";
import assert from "node:assert/strict";
import { MEDIDAS_CAMPOS } from "./indices.js";
import {
  MAX_AVALIACOES,
  montarSerie,
  opcoesDisponiveis,
  ROTULOS,
  SOMA_KEY,
  toNumber,
} from "./evolucao.js";

const TODAS = MEDIDAS_CAMPOS.map(({ key }) => key);

const avaliacaoCompleta = (id, base) => ({
  id,
  medidas: Object.fromEntries(TODAS.map((key, i) => [key, base + i])),
});

const somaDe = (avaliacao, chaves) =>
  chaves.reduce((total, key) => total + toNumber(avaliacao.medidas[key]), 0);

test("soma total: avaliações com todas as medidas preenchidas usam as 16 medidas", () => {
  const a1 = avaliacaoCompleta("a1", 30);
  const a2 = avaliacaoCompleta("a2", 31);

  const { pontos, medidasSoma } = montarSerie([a1, a2], SOMA_KEY);

  assert.deepEqual(medidasSoma, TODAS);
  assert.equal(pontos.length, 2);
  assert.equal(pontos[0].valor, somaDe(a1, TODAS));
  assert.equal(pontos[1].valor, somaDe(a2, TODAS));
  assert.equal(pontos[1].valor - pontos[0].valor, TODAS.length);
});

test("soma total: quantidades diferentes de medidas usam só as medidas em comum", () => {
  const antiga = avaliacaoCompleta("antiga", 30);
  const recente = {
    id: "recente",
    medidas: { cintura: "80", quadril: "100", torax: "", bracoDireito: null, abdomen: NaN },
  };

  const { pontos, medidasSoma } = montarSerie([antiga, recente], SOMA_KEY);

  assert.deepEqual(medidasSoma, ["cintura", "quadril"]);
  assert.equal(pontos[0].valor, antiga.medidas.cintura + antiga.medidas.quadril);
  assert.equal(pontos[1].valor, 180);
});

test("soma total: o conjunto comum considera só as avaliações exibidas", () => {
  const foraDaJanela = { id: "velha", medidas: { cintura: 90 } };
  const exibidas = Array.from({ length: MAX_AVALIACOES }, (_, i) =>
    avaliacaoCompleta(`a${i}`, 30 + i)
  );

  const { pontos, medidasSoma } = montarSerie([foraDaJanela, ...exibidas], SOMA_KEY);

  assert.equal(pontos.length, MAX_AVALIACOES);
  assert.deepEqual(medidasSoma, TODAS);
  assert.deepEqual(
    pontos.map((p) => p.avaliacao.id),
    exibidas.map((a) => a.id)
  );
});

test("valores numéricos, em texto e com vírgula decimal são aceitos; inválidos ignorados", () => {
  assert.equal(toNumber(82), 82);
  assert.equal(toNumber("82"), 82);
  assert.equal(toNumber("82.5"), 82.5);
  assert.equal(toNumber("82,5"), 82.5);

  for (const invalido of [undefined, null, "", NaN, "NaN", 0, "0", -3, "abc"]) {
    assert.equal(toNumber(invalido), null, `deveria ignorar ${String(invalido)}`);
  }

  const a1 = { id: "a1", medidas: { cintura: "82,5", quadril: 100 } };
  const a2 = { id: "a2", medidas: { cintura: "80.5", quadril: "99,5" } };
  const { pontos, medidasSoma } = montarSerie([a1, a2], SOMA_KEY);
  assert.deepEqual(medidasSoma, ["cintura", "quadril"]);
  assert.equal(pontos[0].valor, 182.5);
  assert.equal(pontos[1].valor, 180);
});

test("soma total: sem medidas em comum não inventa resultado", () => {
  const a1 = { id: "a1", medidas: { cintura: 80 } };
  const a2 = { id: "a2", medidas: { quadril: 100 } };

  const { pontos, medidasSoma } = montarSerie([a1, a2], SOMA_KEY);

  assert.deepEqual(pontos, []);
  assert.deepEqual(medidasSoma, []);
});

test("gráficos individuais continuam iguais: ignora avaliações sem a medida e limita a janela", () => {
  const avaliacoes = [
    { id: "a1", medidas: { cintura: 90 } },
    { id: "a2", medidas: { cintura: "" } },
    { id: "a3", medidas: { cintura: "88,5" } },
    { id: "a4", medidas: { cintura: "87" } },
    { id: "a5", medidas: {} },
    { id: "a6", medidas: { cintura: 86 } },
    { id: "a7", medidas: { cintura: 85 } },
    { id: "a8", medidas: { cintura: 84, quadril: 100 } },
  ];

  const { pontos, medidasSoma } = montarSerie(avaliacoes, "cintura");

  assert.equal(medidasSoma, null);
  assert.deepEqual(
    pontos.map((p) => [p.avaliacao.id, p.valor]),
    [
      ["a3", 88.5],
      ["a4", 87],
      ["a6", 86],
      ["a7", 85],
      ["a8", 84],
    ]
  );

  const quadril = montarSerie(avaliacoes, "quadril");
  assert.deepEqual(quadril.pontos.map((p) => p.valor), [100]);
});

test("opções do seletor: só medidas com dados e soma quando existe alguma medida", () => {
  const avaliacoes = [{ id: "a1", medidas: { cintura: 80, quadril: "NaN" } }];
  assert.deepEqual(
    opcoesDisponiveis(avaliacoes).map((o) => o.key),
    ["cintura", SOMA_KEY]
  );
  assert.deepEqual(opcoesDisponiveis([{ id: "a1", medidas: {} }]), []);
});

test('rótulo do primeiro card é "Primeira exibida"', () => {
  assert.equal(ROTULOS.primeira, "Primeira exibida");
  assert.equal(ROTULOS.ultima, "Última avaliação");
});
