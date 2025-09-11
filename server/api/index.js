import express from 'express';
import cors from 'cors';
import clientesRoutes from '../src/routes/clientesRoutes.js';
import avaliacoesRoutes from '../src/routes/avaliacoesRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/clientes', clientesRoutes);
app.use('/api/avaliacoes', avaliacoesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'MedFit API',
    version: '1.0.0',
    endpoints: ['/api/clientes', '/api/avaliacoes', '/api/health']
  });
});

// Para Vercel, exportar como default
export default app;

// Para desenvolvimento local, iniciar servidor
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 API disponível em http://localhost:${PORT}/api`);
  });
}
