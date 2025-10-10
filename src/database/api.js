import express from 'express';
import cors from 'cors';
import { listarClientes, salvarCliente } from './clientes.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Listar clientes
app.get('/api/clientes', (req, res) => {
  try {
    const clientes = listarClientes();
    res.json(clientes);
  } catch {
    res.status(500).json({ erro: 'Erro ao listar clientes' });
  }
});

// Cadastrar cliente
app.post('/api/clientes', (req, res) => {
  try {
    const cliente = salvarCliente(req.body);
    res.status(201).json(cliente);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
