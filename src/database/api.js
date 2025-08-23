const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.json());

const filePath = path.join(__dirname, 'clientes.json');

// Listar clientes
app.get('/api/clientes', (req, res) => {
  if (fs.existsSync(filePath)) {
    const clientes = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(clientes);
  } else {
    res.json([]);
  }
});

// Cadastrar cliente
app.post('/api/clientes', (req, res) => {
  const cliente = req.body;
  let clientes = [];
  if (fs.existsSync(filePath)) {
    clientes = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  clientes.push(cliente);
  fs.writeFileSync(filePath, JSON.stringify(clientes, null, 2));
  res.status(201).json(cliente);
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});