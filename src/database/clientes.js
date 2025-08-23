const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'clientes.json');

// Função para salvar cliente
function salvarCliente(cliente) {
  let clientes = [];
  if (fs.existsSync(filePath)) {
    clientes = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  clientes.push(cliente);
  fs.writeFileSync(filePath, JSON.stringify(clientes, null, 2));
}

// Função para listar clientes
function listarClientes() {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return [];
}

module.exports = { salvarCliente, listarClientes };