// Configuração da API
// Para desenvolvimento local, use: 'http://192.168.0.9:3000'
// Para produção, use: 'https://med-fit-tawny.vercel.app'
const API_BASE_URL = 'http://192.168.0.9:3000';

export const API_ENDPOINTS = {
  clientes: `${API_BASE_URL}/api/clientes`,
  avaliacoes: `${API_BASE_URL}/api/avaliacoes`
};

export default API_BASE_URL;