# 🔄 Atualizar URL da API da Vercel

## 📋 Instruções

### 1. Após fazer deploy na Vercel:
- Você receberá uma URL como: `https://medfit-backend-abc123.vercel.app`
- **COPIE** essa URL

### 2. Atualizar src/config/api.js:
Substitua `https://medfit-backend.vercel.app` pela sua URL real:

```javascript
// Configuração da API
const API_BASE_URL = 'https://SUA-URL-VERCEL.vercel.app';

export const API_ENDPOINTS = {
  clientes: `${API_BASE_URL}/api/clientes`,
  avaliacoes: `${API_BASE_URL}/api/avaliacoes`
};

export default API_BASE_URL;
```

### 3. Build e Deploy:
```bash
npm run build
firebase deploy --only hosting
```

## ✅ Resultado:
- ✅ Frontend: `https://medfit-2538a.web.app`
- ✅ API: `https://SUA-URL-VERCEL.vercel.app`
- ✅ Todas as chamadas direcionadas para Vercel

## 🎯 URLs funcionais:
- `https://medfit-2538a.web.app` → Frontend PWA
- Todas as chamadas `/api/*` → API da Vercel

## 📁 Arquivos atualizados:
- ✅ `src/config/api.js` - Configuração centralizada
- ✅ `src/screens/Cadastro.jsx` - Chamadas atualizadas
- ✅ `src/screens/Avaliacao.jsx` - Chamadas atualizadas
- ✅ `src/screens/Clientes.jsx` - Chamadas atualizadas
- ✅ `src/screens/Home.jsx` - Chamadas atualizadas
- ✅ `src/screens/Historico.jsx` - Chamadas atualizadas