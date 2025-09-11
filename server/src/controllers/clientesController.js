import { createCliente as createClienteRepo, getAllClientes as getAllClientesRepo, getClienteById as getClienteByIdRepo, updateCliente as updateClienteRepo, deleteCliente as deleteClienteRepo } from '../repositories/clientesRepo.js';

export const createCliente = async (req, res) => {
  try {
    const clienteData = {
      ...req.body,
      dataCadastro: new Date().toISOString()
    };
    
    const cliente = await createClienteRepo(clienteData);
    res.status(201).json(cliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const getAllClientes = async (req, res) => {
  try {
    const clientes = await getAllClientesRepo();
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await getClienteByIdRepo(id);
    
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const clienteData = req.body;
    
    const cliente = await updateClienteRepo(id, clienteData);
    
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const sucesso = await deleteClienteRepo(id);
    
    if (!sucesso) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    res.json({ mensagem: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};
