import express from 'express';
import { createAvaliacao, getAllAvaliacoes, getAvaliacaoById, updateAvaliacao, deleteAvaliacao } from '../controllers/avaliacoesController.js';

const router = express.Router();

// GET /api/avaliacoes - Listar todas as avaliações
router.get('/', getAllAvaliacoes);

// GET /api/avaliacoes/:id - Buscar avaliação por ID
router.get('/:id', getAvaliacaoById);

// POST /api/avaliacoes - Criar nova avaliação
router.post('/', createAvaliacao);

// PUT /api/avaliacoes/:id - Atualizar avaliação
router.put('/:id', updateAvaliacao);

// DELETE /api/avaliacoes/:id - Deletar avaliação
router.delete('/:id', deleteAvaliacao);

export default router;
