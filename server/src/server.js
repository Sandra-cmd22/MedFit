import express from 'express';
import cors from 'cors';
import clientesRoutes from './routes/clientesRoutes.js';
import avaliacoesRoutes from './routes/avaliacoesRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/clientes', clientesRoutes);
app.use('/api/avaliacoes', avaliacoesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 API disponível em http://localhost:${PORT}/api`);
});
