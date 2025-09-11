# 🚀 Deploy do Backend MedFit

## 📋 Pré-requisitos
- Conta no GitHub
- Conta na Vercel (gratuita)
- Código do backend no GitHub

## 🆓 Opção 1: Vercel (Recomendado - Gratuito)

### 1. Preparar o repositório
```bash
# Fazer commit dos arquivos de deploy
git add server/vercel.json server/package.json
git commit -m "feat: adicionar configuração para deploy na Vercel"
git push origin main
```

### 2. Deploy na Vercel
1. Acesse: https://vercel.com
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione seu repositório MedFit
5. Configure:
   - **Root Directory:** `server`
   - **Framework Preset:** Other
   - **Build Command:** (deixe vazio)
   - **Output Directory:** (deixe vazio)
6. Clique em "Deploy"

### 3. Configurar Frontend
Após o deploy, você receberá uma URL como: `https://medfit-backend.vercel.app`

Atualize o `vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'https://medfit-backend.vercel.app',
      changeOrigin: true,
      secure: true,
    }
  }
}
```

## 🆓 Opção 2: Railway

### 1. Preparar para Railway
```bash
# Criar Procfile
echo "web: node src/server.js" > server/Procfile
```

### 2. Deploy no Railway
1. Acesse: https://railway.app
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha o repositório MedFit
6. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

## 🆓 Opção 3: Render

### 1. Preparar para Render
```bash
# Criar render.yaml
cat > server/render.yaml << EOF
services:
  - type: web
    name: medfit-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    plan: free
EOF
```

### 2. Deploy no Render
1. Acesse: https://render.com
2. Faça login com GitHub
3. Clique em "New +"
4. Selecione "Web Service"
5. Conecte seu repositório
6. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

## 🔧 Configurações Importantes

### Variáveis de Ambiente
Adicione no painel de deploy:
- `NODE_ENV=production`
- `PORT=3000` (ou porta fornecida pelo serviço)

### CORS
O backend já está configurado para aceitar requisições de qualquer origem em desenvolvimento. Em produção, você pode restringir:

```javascript
app.use(cors({
  origin: ['https://medfit-2538a.web.app', 'https://seu-dominio.com']
}));
```

## 📱 Atualizar Frontend

Após o deploy, atualize:

### 1. vite.config.js
```javascript
export default defineConfig({
  // ... outras configurações
  server: {
    proxy: {
      '/api': {
        target: 'https://sua-api-url.com', // URL da API em produção
        changeOrigin: true,
        secure: true,
      }
    }
  }
});
```

### 2. Build e Deploy Frontend
```bash
npm run build
firebase deploy --only hosting
```

## ✅ Checklist Final

- [ ] Backend deployado e funcionando
- [ ] URL da API obtida
- [ ] Frontend atualizado com nova URL
- [ ] Build do frontend realizado
- [ ] Deploy do frontend no Firebase
- [ ] Teste completo do sistema

## 🆘 Troubleshooting

### Erro de CORS
- Verifique se o CORS está configurado corretamente
- Adicione a URL do frontend nas origens permitidas

### Erro 404
- Verifique se as rotas estão configuradas corretamente
- Confirme se o arquivo server.js está no local correto

### Timeout
- Verifique se o servidor está respondendo
- Confirme se a porta está correta

## 🎉 Resultado Final

Após o deploy, você terá:
- ✅ **Frontend:** https://medfit-2538a.web.app (Firebase)
- ✅ **Backend:** https://sua-api.vercel.app (Vercel/Railway/Render)
- ✅ **PWA completo** funcionando em produção
- ✅ **Sistema offline** com cache inteligente
