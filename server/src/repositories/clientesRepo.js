import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../../data');
const clientesPath = path.join(dataPath, 'clientes.json');

// Garantir que a pasta data existe
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Inicializar arquivo de clientes se não existir
if (!fs.existsSync(clientesPath)) {
  fs.writeFileSync(clientesPath, JSON.stringify([], null, 2));
}

const readClientes = () => {
  try {
    const data = fs.readFileSync(clientesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler clientes:', error);
    return [];
  }
};

const writeClientes = (clientes) => {
  try {
    fs.writeFileSync(clientesPath, JSON.stringify(clientes, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar clientes:', error);
    return false;
  }
};

export const createCliente = async (clienteData) => {
  const clientes = readClientes();
  const novoCliente = {
    id: Date.now().toString(),
    ...clienteData,
    dataCadastro: new Date().toISOString()
  };
  
  clientes.push(novoCliente);
  
  if (writeClientes(clientes)) {
    return novoCliente;
  } else {
    throw new Error('Erro ao salvar cliente');
  }
};

export const getAllClientes = async () => {
  return readClientes();
};

export const getClienteById = async (id) => {
  const clientes = readClientes();
  return clientes.find(cliente => cliente.id === id);
};

export const updateCliente = async (id, clienteData) => {
  const clientes = readClientes();
  const index = clientes.findIndex(cliente => cliente.id === id);
  
  if (index === -1) {
    return null;
  }
  
  clientes[index] = {
    ...clientes[index],
    ...clienteData,
    id, // Garantir que o ID não seja alterado
    dataAtualizacao: new Date().toISOString()
  };
  
  if (writeClientes(clientes)) {
    return clientes[index];
  } else {
    throw new Error('Erro ao atualizar cliente');
  }
};

export const deleteCliente = async (id) => {
  const clientes = readClientes();
  const index = clientes.findIndex(cliente => cliente.id === id);
  
  if (index === -1) {
    return false;
  }
  
  clientes.splice(index, 1);
  
  return writeClientes(clientes);
};
