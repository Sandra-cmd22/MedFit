import { Router } from "express";
import { clientesController } from "../controllers/clientesController.js";

const router = Router();

// GET /api/clientes - Lista todos os clientes
router.get("/", clientesController.listarTodos);

// GET /api/clientes/buscar?nome=... - Busca clientes por nome
router.get("/buscar", clientesController.buscarPorNome);

// GET /api/clientes/stats - Estatísticas dos clientes
router.get("/stats", clientesController.estatisticas);

// GET /api/clientes/:id - Busca cliente por ID
router.get("/:id", clientesController.buscarPorId);

// POST /api/clientes - Cria novo cliente
router.post("/", clientesController.criar);

// PUT /api/clientes/:id - Atualiza cliente
router.put("/:id", clientesController.atualizar);

// DELETE /api/clientes/:id - Remove cliente
router.delete("/:id", clientesController.remover);

export default router; 