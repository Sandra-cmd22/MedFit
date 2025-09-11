#!/bin/bash

# Script para configurar Firebase MedFit
echo "🔥 Configurando Firebase para MedFit..."

# Verificar se Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI não encontrado. Instalando..."
    npm install -g firebase-tools
fi

# Verificar se está logado
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Faça login no Firebase:"
    firebase login
fi

# Inicializar projeto Firebase
echo "🚀 Inicializando projeto Firebase..."
firebase init

# Instalar dependências das functions
echo "📦 Instalando dependências das Functions..."
cd functions && npm install && cd ..

# Build do frontend
echo "🏗️ Fazendo build do frontend..."
npm run build

echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure seu projeto Firebase no console"
echo "2. Execute: npm run emulator para testar localmente"
echo "3. Execute: npm run deploy para fazer deploy"
