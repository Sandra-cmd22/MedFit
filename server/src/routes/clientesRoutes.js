import express from 'express';
import { createCliente, getAllClientes, getClienteById, updateCliente, deleteCliente } from '../controllers/clientesController.js';

const router = express.Router();

// GET /api/clientes - Listar todos os clientes
router.get('/', getAllClientes);

// GET /api/clientes/:id - Buscar cliente por ID
router.get('/:id', getClienteById);

// POST /api/clientes - Criar novo cliente
router.post('/', createCliente);

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', updateCliente);

// DELETE /api/clientes/:id - Deletar cliente
router.delete('/:id', deleteCliente);

export default router;
