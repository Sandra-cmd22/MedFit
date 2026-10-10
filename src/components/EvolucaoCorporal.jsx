import React, { useMemo, useState } from "react";
import { MEDIDAS_CAMPOS } from "../utils/indices.js";
import {
  montarSerie,
  OPCOES_MEDIDA,
  opcoesDisponiveis as calcularOpcoes,
  ROTULOS,
  SOMA_KEY,
} from "../utils/evolucao.js";
import "./EvolucaoCorporal.css";

const MEDIDAS_REDUZIR = ["cintura", "abdomen"];
const TOTAL_MEDIDAS = MEDIDAS_CAMPOS.length;

const SIZE = 300;
const CENTER = SIZE / 2;
const RAIO_EXTERNO = 132;
const ESPESSURA = 16;
const ESPACO = 8;
const ARCO = 0.75;

const COR_ATUAL = "#D70C1C";
const CORES_ANTERIORES = ["#374151", "#6b7280", "#9ca3af", "#d1d5db"];

const rotuloDaMedida = (key) => MEDIDAS_CAMPOS.find((m) => m.key === key)?.label || key;

const fmt = (n) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });

const fmtVariacao = (n) => {
  const arredondado = Math.round(n * 10) / 10;
  if (arredondado === 0) return "0 cm";
  return `${arredondado > 0 ? "+" : ""}${fmt(arredondado)} cm`;
};

const tendencia = (key, diff) => {
  const arredondado = Math.round(diff * 10) / 10;
  if (arredondado === 0) return { texto: "Estável", classe: "badge-gray" };
  const subiu = arredondado > 0;
  if (MEDIDAS_REDUZIR.includes(key)) {
    return subiu
      ? { texto: "Aumentou", classe: "badge-amber" }
      : { texto: "Reduziu", classe: "badge-green" };
  }
  return { texto: subiu ? "Aumentou" : "Diminuiu", classe: "badge-gray" };
};

const PainelVazio = ({ icone, titulo, texto }) => (
  <section className="panel evolucao">
    <div className="panel-header">
      <h2 className="panel-title">
        <span className="material-symbols-rounded">donut_large</span>
        Evolução corporal
      </h2>
    </div>
    <div className="empty-state">
      <span className="material-symbols-rounded">{icone}</span>
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
    </div>
  </section>
);

const EvolucaoCorporal = ({ avaliacoes, formatDate, carregando = false, erro = false }) => {
  const [medidaEscolhida, setMedidaEscolhida] = useState(null);

  const cronologicas = useMemo(() => [...(avaliacoes || [])].reverse(), [avaliacoes]);

  const opcoesDisponiveis = useMemo(() => calcularOpcoes(cronologicas), [cronologicas]);

  const medidaAtual = opcoesDisponiveis.some((o) => o.key === medidaEscolhida)
    ? medidaEscolhida
    : opcoesDisponiveis.find((o) => o.key === "cintura")?.key ||
      opcoesDisponiveis[0]?.key;

  const { pontos, medidasSoma } = useMemo(() => {
    if (!medidaAtual) return { pontos: [], medidasSoma: null };
    const serie = montarSerie(cronologicas, medidaAtual);
    return {
      medidasSoma: serie.medidasSoma,
      pontos: serie.pontos.map(({ avaliacao, valor }) => ({
        id: avaliacao.id,
        data: formatDate(avaliacao.dataAvaliacao || avaliacao.evaluationDate || avaliacao.startDate),
        valor,
      })),
    };
  }, [cronologicas, medidaAtual, formatDate]);

  const rotulo = OPCOES_MEDIDA.find((o) => o.key === medidaAtual)?.label || "";

  if (carregando && cronologicas.length === 0) {
    return (
      <PainelVazio icone="hourglass_empty" titulo="Carregando avaliações..." />
    );
  }

  if (erro) {
    return (
      <PainelVazio
        icone="error"
        titulo="Não foi possível carregar as avaliações"
        texto="Use o botão de atualizar para tentar novamente."
      />
    );
  }

  if (cronologicas.length === 0) {
    return (
      <PainelVazio
        icone="donut_large"
        titulo="Nenhuma avaliação encontrada para este aluno"
        texto="O gráfico aparece assim que houver avaliações registradas."
      />
    );
  }

  if (opcoesDisponiveis.length === 0) {
    return (
      <PainelVazio
        icone="donut_large"
        titulo="Nenhuma medida registrada nas avaliações"
        texto="O gráfico aparece assim que o aluno tiver medidas cadastradas."
      />
    );
  }

  const ehSoma = medidaAtual === SOMA_KEY;
  const semMedidasEmComum = ehSoma && pontos.length === 0;

  const seletor = (
    <div className="field evolucao-select">
      <label htmlFor="evolucao-medida">Escolha a medida</label>
      <select
        id="evolucao-medida"
        className="input"
        value={medidaAtual}
        onChange={(e) => setMedidaEscolhida(e.target.value)}
      >
        {opcoesDisponiveis.map(({ key, label }) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );

  if (semMedidasEmComum) {
    return (
      <section className="panel evolucao">
        <div className="panel-header">
          <h2 className="panel-title">
            <span className="material-symbols-rounded">donut_large</span>
            Evolução corporal
          </h2>
          {seletor}
        </div>
        <div className="empty-state">
          <span className="material-symbols-rounded">rule</span>
          <h3>Sem medidas em comum para somar</h3>
          <p>
            As avaliações exibidas não têm nenhuma medida preenchida em todas elas, então a
            soma não pode ser comparada. Escolha uma medida individual.
          </p>
        </div>
      </section>
    );
  }

  const primeira = pontos[0];
  const ultima = pontos[pontos.length - 1];
  const temComparacao = pontos.length >= 2;
  const variacao = temComparacao ? ultima.valor - primeira.valor : null;
  const status = temComparacao ? tendencia(medidaAtual, variacao) : null;

  const maior = Math.max(...pontos.map((p) => p.valor));
  const aneis = [...pontos].reverse().map((p, i) => {
    const raio = RAIO_EXTERNO - i * (ESPESSURA + ESPACO);
    const circunferencia = 2 * Math.PI * raio;
    const fracao = (p.valor / maior) * ARCO;
    return {
      ...p,
      raio,
      circunferencia,
      fracao,
      cor: i === 0 ? COR_ATUAL : CORES_ANTERIORES[Math.min(i - 1, CORES_ANTERIORES.length - 1)],
    };
  });

  const linhasTabela = [...pontos]
    .map((p, i) => ({
      ...p,
      diff: i > 0 ? p.valor - pontos[i - 1].valor : null,
    }))
    .reverse();

  return (
    <section className="panel evolucao">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">
            <span className="material-symbols-rounded">donut_large</span>
            Evolução corporal
          </h2>
          <p className="panel-hint evolucao-sub">
            {pontos.length === 1
              ? "1 avaliação exibida"
              : `${pontos.length} avaliações exibidas · a variação compara a primeira e a última exibidas`}
          </p>
        </div>
        {seletor}
      </div>

      {ehSoma && medidasSoma && (
        <p
          className={`evolucao-soma-aviso${
            medidasSoma.length < TOTAL_MEDIDAS ? " parcial" : ""
          }`}
        >
          <span className="material-symbols-rounded">info</span>
          {medidasSoma.length === TOTAL_MEDIDAS
            ? `Soma das ${TOTAL_MEDIDAS} medidas, preenchidas em todas as avaliações exibidas.`
            : `Soma parcial: ${medidasSoma.length} de ${TOTAL_MEDIDAS} medidas, as únicas preenchidas em todas as avaliações exibidas — ${medidasSoma
                .map(rotuloDaMedida)
                .join(", ")}.`}
        </p>
      )}

      <div className="evolucao-body">
        <div className="evolucao-chart">
          <svg
            viewBox={`-30 0 ${SIZE + 30} ${SIZE}`}
            role="img"
            aria-label={`Evolução de ${rotulo}`}
          >
            {aneis.map((anel) => (
              <g key={anel.id}>
                <circle
                  className="evolucao-trilha"
                  cx={CENTER}
                  cy={CENTER}
                  r={anel.raio}
                  strokeWidth={ESPESSURA}
                  strokeDasharray={`${anel.circunferencia * ARCO} ${anel.circunferencia}`}
                  transform={`rotate(-90 ${CENTER} ${CENTER})`}
                />
                <circle
                  className="evolucao-arco"
                  cx={CENTER}
                  cy={CENTER}
                  r={anel.raio}
                  stroke={anel.cor}
                  strokeWidth={ESPESSURA}
                  strokeDasharray={`${anel.circunferencia * anel.fracao} ${anel.circunferencia}`}
                  transform={`rotate(-90 ${CENTER} ${CENTER})`}
                >
                  <title>{`${anel.data}: ${fmt(anel.valor)} cm`}</title>
                </circle>
                <text
                  className="evolucao-rotulo"
                  x={CENTER - 14}
                  y={CENTER - anel.raio + 4}
                  textAnchor="end"
                >
                  {anel.data} · {fmt(anel.valor)} cm
                </text>
              </g>
            ))}
          </svg>
          <p className="evolucao-legenda">
            <span className="evolucao-dot" style={{ background: COR_ATUAL }} />
            Anel externo = avaliação mais recente
          </p>
        </div>

        <div className="evolucao-info">
          <div className="evolucao-resumo">
            <div className="evolucao-card">
              <p className="stat-label">{ROTULOS.primeira}</p>
              <p className="evolucao-valor">
                {fmt(primeira.valor)}
                <span className="stat-unit">cm</span>
              </p>
              <p className="stat-foot">{primeira.data}</p>
            </div>
            <div className="evolucao-card">
              <p className="stat-label">{ROTULOS.ultima}</p>
              <p className="evolucao-valor">
                {fmt(ultima.valor)}
                <span className="stat-unit">cm</span>
              </p>
              <p className="stat-foot">{ultima.data}</p>
            </div>
            <div className="evolucao-card destaque">
              <p className="stat-label">{ROTULOS.variacao}</p>
              <p className="evolucao-valor">
                {temComparacao ? fmtVariacao(variacao) : "-"}
              </p>
              {status ? (
                <span className={`badge ${status.classe}`}>{status.texto}</span>
              ) : (
                <p className="stat-foot">Registre outra avaliação para comparar</p>
              )}
            </div>
          </div>

          <table className="data-table evolucao-table">
            <thead>
              <tr>
                <th>Data</th>
                <th className="num">{rotulo} (cm)</th>
                <th className="num">Variação</th>
              </tr>
            </thead>
            <tbody>
              {linhasTabela.map((linha) => {
                const cor = aneis.find((a) => a.id === linha.id)?.cor;
                return (
                  <tr key={linha.id}>
                    <td>
                      <span className="evolucao-dot" style={{ background: cor }} />
                      {linha.data}
                    </td>
                    <td className="num">{fmt(linha.valor)}</td>
                    <td className="num">
                      {linha.diff === null ? (
                        <span className="panel-hint">Início</span>
                      ) : (
                        fmtVariacao(linha.diff)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default EvolucaoCorporal;
