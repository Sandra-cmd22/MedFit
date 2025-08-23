import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use("/api", routes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint não encontrado"
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Erro na aplicação:", error);
  res.status(500).json({
    success: false,
    message: "Erro interno do servidor"
  });
});

export default app; 