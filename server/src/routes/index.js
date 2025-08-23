import { Router } from "express";
import clientesRoutes from "./clientesRoutes.js";
import avaliacoesRoutes from "./avaliacoesRoutes.js";

const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API está funcionando",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// API routes
router.use("/clientes", clientesRoutes);
router.use("/avaliacoes", avaliacoesRoutes);

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API de Avaliações Físicas",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      clientes: "/api/clientes",
      avaliacoes: "/api/avaliacoes"
    }
  });
});

export default router; 