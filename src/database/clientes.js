import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/database/clientes.json');

// Listar clientes
export function listarClientes() {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return [];
}

// Salvar cliente
export function salvarCliente(cliente) {
  let clientes = listarClientes();
  cliente.id = Date.now();
  clientes.push(cliente);
  fs.writeFileSync(filePath, JSON.stringify(clientes, null, 2));
  return cliente;
}
