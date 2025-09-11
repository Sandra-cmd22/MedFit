# 🔥 Firebase MedFit - Configuração Completa

## 📋 Estrutura do Projeto

```
MedFit/
├── functions/                 # Cloud Functions
│   ├── src/
│   │   ├── index.js          # Função principal (calcularIMCRCQ)
│   │   └── utils.js          # Funções de cálculo (IMC, RCQ)
│   ├── package.json          # Dependências das Functions
│   └── test-data.json        # Dados de exemplo
├── dist/                     # Build do frontend (PWA)
├── firebase.json             # Configuração Firebase
├── database.rules.json       # Regras do Realtime Database
└── scripts/
    └── firebase-setup.sh     # Script de configuração
```

## 🚀 Configuração Inicial

### 1. Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login no Firebase
```bash
firebase login
```

### 3. Configurar projeto
```bash
npm run setup:firebase
```

### 4. Instalar dependências das Functions
```bash
cd functions && npm install && cd ..
```

## 🧪 Testando Localmente

### Iniciar emuladores
```bash
npm run firebase:emulator
```

**URLs dos emuladores:**
- **Hosting:** http://localhost:5000
- **Functions:** http://localhost:5001
- **Database:** http://localhost:9000
- **UI:** http://localhost:4000

### Testar função manualmente
```bash
curl -X POST http://localhost:5001/[PROJECT-ID]/us-central1/testarCalculos \
  -H "Content-Type: application/json" \
  -d '{
    "peso": 80,
    "altura": 175,
    "cintura": 90,
    "quadril": 100,
    "sexo": "Masculino"
  }'
```

## 📊 Estrutura do Banco de Dados

### Realtime Database
```
/clientes/{clienteId}/
├── nome: "João Silva"
├── idade: 30
├── sexo: "Masculino"
├── medidas/
│   ├── peso: 80
│   ├── altura: 175
│   ├── cintura: 90
│   └── quadril: 100
└── resultados/          # ← Gerado automaticamente
    ├── imc/
    │   ├── valor: 26.12
    │   ├── categoria: "Sobrepeso"
    │   └── risco: "Moderado"
    ├── rcq/
    │   ├── valor: 0.9
    │   ├── categoria: "Risco moderado"
    │   └── risco: "Moderado"
    └── dataCalculo: "2025-01-11T20:30:00.000Z"
```

## 🔧 Cloud Functions

### 1. calcularIMCRCQ
- **Trigger:** `onWrite` em `/clientes/{clienteId}/medidas`
- **Função:** Calcula IMC e RCQ automaticamente
- **Logs:** Detalhados para cada etapa

### 2. testarCalculos
- **Trigger:** HTTP POST
- **Função:** Teste manual de cálculos
- **URL:** `/testarCalculos`

### 3. estatisticas
- **Trigger:** HTTP GET
- **Função:** Estatísticas do banco
- **URL:** `/estatisticas`

## 📈 Cálculos Implementados

### IMC (Índice de Massa Corporal)
```javascript
IMC = peso / (altura * altura)
```

**Categorias:**
- < 18.5: Abaixo do peso
- 18.5-24.9: Peso normal
- 25-29.9: Sobrepeso
- 30-34.9: Obesidade grau I
- 35-39.9: Obesidade grau II
- ≥ 40: Obesidade grau III

### RCQ (Relação Cintura-Quadril)
```javascript
RCQ = cintura / quadril
```

**Categorias (Masculino):**
- < 0.9: Baixo risco
- 0.9-1.0: Risco moderado
- > 1.0: Alto risco

**Categorias (Feminino):**
- < 0.8: Baixo risco
- 0.8-0.85: Risco moderado
- > 0.85: Alto risco

## 🚀 Deploy

### Deploy completo
```bash
npm run firebase:deploy
```

### Deploy apenas Functions
```bash
npm run firebase:deploy:functions
```

### Deploy apenas Hosting
```bash
npm run firebase:deploy:hosting
```

## 📝 Logs

### Ver logs das Functions
```bash
npm run firebase:logs
```

## 🔍 Exemplo de Uso

### 1. Salvar dados do cliente
```javascript
// No frontend
const clienteRef = firebase.database().ref(`/clientes/${clienteId}`);
await clienteRef.child('medidas').set({
  peso: 80,
  altura: 175,
  cintura: 90,
  quadril: 100
});
```

### 2. Function é disparada automaticamente
- Calcula IMC e RCQ
- Salva em `/clientes/{clienteId}/resultados`

### 3. Recuperar resultados
```javascript
const resultadosRef = firebase.database().ref(`/clientes/${clienteId}/resultados`);
const snapshot = await resultadosRef.once('value');
const resultados = snapshot.val();

console.log('IMC:', resultados.imc.valor, resultados.imc.categoria);
console.log('RCQ:', resultados.rcq.valor, resultados.rcq.categoria);
```

## 🛡️ Regras de Segurança

- **Leitura:** Pública para todos os clientes
- **Escrita:** Pública para medidas, apenas Functions para resultados
- **Validação:** Medidas devem ter valores positivos

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs: `npm run firebase:logs`
2. Teste localmente: `npm run firebase:emulator`
3. Consulte a documentação do Firebase
