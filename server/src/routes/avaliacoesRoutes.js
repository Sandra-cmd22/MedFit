import { Router } from "express";
import { avaliacoesController } from "../controllers/avaliacoesController.js";

const router = Router();

// GET /api/avaliacoes - Lista todas as avaliações
router.get("/", avaliacoesController.listarTodas);

// GET /api/avaliacoes/periodo?inicio=...&fim=... - Busca avaliações por período
router.get("/periodo", avaliacoesController.buscarPorPeriodo);

// GET /api/avaliacoes/stats - Estatísticas das avaliações
router.get("/stats", avaliacoesController.estatisticas);

// GET /api/avaliacoes/cliente/:clienteId - Lista avaliações de um cliente
router.get("/cliente/:clienteId", avaliacoesController.listarPorCliente);

// GET /api/avaliacoes/cliente/:clienteId/ultima - Busca última avaliação de um cliente
router.get("/cliente/:clienteId/ultima", avaliacoesController.buscarUltimaPorCliente);

// GET /api/avaliacoes/:id - Busca avaliação por ID
router.get("/:id", avaliacoesController.buscarPorId);

// POST /api/avaliacoes - Cria nova avaliação
router.post("/", avaliacoesController.criar);

// PUT /api/avaliacoes/:id - Atualiza avaliação
router.put("/:id", avaliacoesController.atualizar);

// DELETE /api/avaliacoes/:id - Remove avaliação
router.delete("/:id", avaliacoesController.remover);

export default router; 