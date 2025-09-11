// Configuração da API
// Para desenvolvimento local, use: 'http://192.168.0.9:3000'
// Para produção, use: 'https://med-fit-tawny.vercel.app'
   // Em src/config/api.js
   const API_BASE_URL = 'https://sua-api-vercel.vercel.app';

export const API_ENDPOINTS = {
  clientes: `${API_BASE_URL}/api/clientes`,
  avaliacoes: `${API_BASE_URL}/api/avaliacoes`
};

export default API_BASE_URL;
