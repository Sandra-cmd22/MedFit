const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function createIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Fundo azul
    ctx.fillStyle = '#0C518D';
    ctx.fillRect(0, 0, size, size);
    
    // Texto "MF" branco no centro
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MF', size/2, size/2);
    
    // Borda branca
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = size * 0.02;
    ctx.strokeRect(size * 0.05, size * 0.05, size * 0.9, size * 0.9);
    
    // Salvar arquivo
    const buffer = canvas.toBuffer('image/png');
    const publicPath = path.join(__dirname, 'public', filename);
    fs.writeFileSync(publicPath, buffer);
    
    console.log(`Ícone criado: ${filename} (${size}x${size})`);
}

// Criar diretório public se não existir
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Gerar ícones
createIcon(192, 'icon-192x192.png');
createIcon(512, 'icon-512x512.png');

console.log('Todos os ícones foram gerados com sucesso!');
