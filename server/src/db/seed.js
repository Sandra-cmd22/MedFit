import db from "./index.js";
import dayjs from "dayjs";

// Limpar dados existentes
db.prepare("DELETE FROM avaliacoes").run();
db.prepare("DELETE FROM clientes").run();

// Inserir clientes
const insertCliente = db.prepare(`
  INSERT INTO clientes (nome, telefone, nascimento, sexo) 
  VALUES (?, ?, ?, ?)
`);

const cliente1 = insertCliente.run("Maria Silva", "(11) 99999-1111", "1990-05-15", "F");
const cliente2 = insertCliente.run("João Santos", "(11) 99999-2222", "1985-08-22", "M");

// Inserir avaliações
const insertAvaliacao = db.prepare(`
  INSERT INTO avaliacoes (cliente_id, data, peso, altura, cintura, quadril, gordura_corporal, braco, coxa, observacoes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Avaliações para Maria Silva (trimestrais)
insertAvaliacao.run(
  cliente1.lastInsertRowid,
  "2024-01-15",
  65.5,
  1.65,
  75.0,
  95.0,
  22.5,
  28.0,
  55.0,
  "Primeira avaliação do ano"
);

insertAvaliacao.run(
  cliente1.lastInsertRowid,
  "2024-04-15",
  64.2,
  1.65,
  73.5,
  93.5,
  21.8,
  27.5,
  54.0,
  "Boa evolução no treino"
);

insertAvaliacao.run(
  cliente1.lastInsertRowid,
  "2024-07-15",
  63.8,
  1.65,
  72.0,
  92.0,
  21.2,
  27.0,
  53.5,
  "Mantendo consistência"
);

// Avaliações para João Santos (trimestrais)
insertAvaliacao.run(
  cliente2.lastInsertRowid,
  "2024-01-20",
  78.0,
  1.75,
  85.0,
  98.0,
  18.5,
  32.0,
  58.0,
  "Início do programa"
);

insertAvaliacao.run(
  cliente2.lastInsertRowid,
  "2024-04-20",
  76.5,
  1.75,
  83.0,
  96.5,
  17.8,
  31.5,
  57.0,
  "Ganho de massa magra"
);

insertAvaliacao.run(
  cliente2.lastInsertRowid,
  "2024-07-20",
  75.2,
  1.75,
  81.5,
  95.0,
  17.2,
  31.0,
  56.5,
  "Excelente progresso"
);

console.log("Seed done."); 