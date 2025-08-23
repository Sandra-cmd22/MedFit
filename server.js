import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

let clientes = [];

// Rota inicial
app.get("/", (req, res) => {
  res.send("API de Clientes está rodando 🚀");
});

// Criar cliente
app.post("/clientes", (req, res) => {
  const novoCliente = req.body;
  clientes.push(novoCliente);
  res.status(201).json({ message: "Cliente cadastrado!", cliente: novoCliente });
});

// Listar clientes
app.get("/clientes", (req, res) => {
  res.json(clientes);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
