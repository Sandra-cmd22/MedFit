import { test } from "node:test";
import assert from "node:assert/strict";
import { criarCarregadorAluno } from "./carregadorAluno.js";

const adiado = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const esperarFila = () => new Promise((resolve) => setTimeout(resolve, 0));

const criarCenario = ({ clientes = {}, avaliacoes = {}, buscarCliente, buscarAvaliacoes } = {}) => {
  const estado = { avaliacoes: [] };
  const historico = [];
  const carregador = criarCarregadorAluno({
    buscarCliente: buscarCliente || (async (aluno) => clientes[aluno] ?? null),
    buscarAvaliacoes: buscarAvaliacoes || (async (aluno) => avaliacoes[aluno] ?? []),
    aplicar: (patch) => {
      historico.push(patch);
      Object.assign(estado, patch);
    },
  });
  return { estado, historico, carregador };
};

const ANA = { id: "c-ana", data: { nome: "Ana" } };
const BIA = { id: "c-bia", data: { nome: "Bia" } };
const AV_ANA = [{ id: "av-ana", medidas: { cintura: 80 } }];
const AV_BIA = [{ id: "av-bia", medidas: { cintura: 70 } }];

test("troca de aluno com avaliações: limpa antes de buscar e mostra as do novo aluno", async () => {
  const { estado, historico, carregador } = criarCenario({
    clientes: { Ana: ANA, Bia: BIA },
    avaliacoes: { Ana: AV_ANA, Bia: AV_BIA },
  });

  await carregador.carregar("Ana");
  assert.deepEqual(estado.avaliacoes, AV_ANA);

  historico.length = 0;
  const resultado = await carregador.carregar("Bia");

  assert.equal(resultado.status, "ok");
  assert.deepEqual(historico[0], {
    avaliacoes: [],
    carregandoAvaliacoes: true,
    erroAvaliacoes: false,
  });
  assert.deepEqual(estado.cliente, BIA.data);
  assert.deepEqual(estado.avaliacoes, AV_BIA);
  assert.equal(estado.carregandoAvaliacoes, false);
  assert.equal(estado.erroAvaliacoes, false);
});

test("recarregar o mesmo aluno não apaga o gráfico enquanto busca", async () => {
  const { historico, carregador } = criarCenario({
    clientes: { Ana: ANA },
    avaliacoes: { Ana: AV_ANA },
  });

  await carregador.carregar("Ana");
  historico.length = 0;
  await carregador.carregar("Ana");

  assert.deepEqual(historico[0], { carregandoAvaliacoes: true });
});

test("troca para aluno sem avaliações: mostra lista vazia, sem dados do anterior", async () => {
  const { estado, carregador } = criarCenario({
    clientes: { Ana: ANA, Bia: BIA },
    avaliacoes: { Ana: AV_ANA, Bia: [] },
  });

  await carregador.carregar("Ana");
  await carregador.carregar("Bia");

  assert.deepEqual(estado.avaliacoes, []);
  assert.equal(estado.erroAvaliacoes, false);
  assert.equal(estado.carregandoAvaliacoes, false);
});

test("troca para aluno não encontrado: não mantém avaliações do anterior", async () => {
  const { estado, carregador } = criarCenario({
    clientes: { Ana: ANA },
    avaliacoes: { Ana: AV_ANA },
  });

  await carregador.carregar("Ana");
  const resultado = await carregador.carregar("Desconhecido");

  assert.equal(resultado.status, "sem-cliente");
  assert.deepEqual(estado.avaliacoes, []);
});

test("falha na busca de avaliações: estado vazio com erro, sem dados do anterior", async () => {
  const falha = new Error("rede indisponível");
  const { estado, carregador } = criarCenario({
    clientes: { Ana: ANA, Bia: BIA },
    buscarAvaliacoes: async (aluno) => {
      if (aluno === "Bia") throw falha;
      return AV_ANA;
    },
  });

  await carregador.carregar("Ana");
  const resultado = await carregador.carregar("Bia");

  assert.equal(resultado.status, "erro");
  assert.equal(resultado.etapa, "avaliacoes");
  assert.equal(resultado.error, falha);
  assert.deepEqual(estado.avaliacoes, []);
  assert.equal(estado.erroAvaliacoes, true);
  assert.equal(estado.carregandoAvaliacoes, false);
});

test("falha na busca do cliente: estado vazio com erro", async () => {
  const { estado, carregador } = criarCenario({
    buscarCliente: async () => {
      throw new Error("falhou");
    },
  });

  const resultado = await carregador.carregar("Ana");

  assert.equal(resultado.status, "erro");
  assert.equal(resultado.etapa, "cliente");
  assert.deepEqual(estado.avaliacoes, []);
  assert.equal(estado.erroAvaliacoes, true);
});

test("requisições fora de ordem: resposta antiga não sobrescreve o aluno atual", async () => {
  const pendentes = { Ana: adiado(), Bia: adiado() };
  const { estado, carregador } = criarCenario({
    clientes: { Ana: ANA, Bia: BIA },
    buscarAvaliacoes: (aluno) => pendentes[aluno].promise,
  });

  const carregandoAna = carregador.carregar("Ana");
  await esperarFila();
  assert.deepEqual(estado.cliente, ANA.data);

  const carregandoBia = carregador.carregar("Bia");

  pendentes.Bia.resolve(AV_BIA);
  assert.equal((await carregandoBia).status, "ok");

  pendentes.Ana.resolve(AV_ANA);
  assert.equal((await carregandoAna).status, "obsoleta");

  assert.deepEqual(estado.avaliacoes, AV_BIA);
  assert.deepEqual(estado.cliente, BIA.data);
});

test("requisições fora de ordem: erro antigo não apaga o aluno atual", async () => {
  const pendentes = { Ana: adiado(), Bia: adiado() };
  const { estado, carregador } = criarCenario({
    clientes: { Ana: ANA, Bia: BIA },
    buscarAvaliacoes: (aluno) => pendentes[aluno].promise,
  });

  const carregandoAna = carregador.carregar("Ana");
  await esperarFila();
  const carregandoBia = carregador.carregar("Bia");

  pendentes.Bia.resolve(AV_BIA);
  await carregandoBia;
  pendentes.Ana.reject(new Error("atrasada"));

  assert.equal((await carregandoAna).status, "obsoleta");
  assert.deepEqual(estado.avaliacoes, AV_BIA);
  assert.equal(estado.erroAvaliacoes, false);
});

test("cancelar invalida buscas em andamento", async () => {
  const pendente = adiado();
  const { estado, carregador } = criarCenario({
    clientes: { Ana: ANA },
    buscarAvaliacoes: () => pendente.promise,
  });

  const carregando = carregador.carregar("Ana");
  await esperarFila();
  carregador.cancelar();
  pendente.resolve(AV_ANA);

  assert.equal((await carregando).status, "obsoleta");
  assert.deepEqual(estado.avaliacoes, []);
});
