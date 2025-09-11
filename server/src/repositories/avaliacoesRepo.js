import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../../data');
const avaliacoesPath = path.join(dataPath, 'avaliacoes.json');

// Garantir que a pasta data existe
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Inicializar arquivo de avaliações se não existir
if (!fs.existsSync(avaliacoesPath)) {
  fs.writeFileSync(avaliacoesPath, JSON.stringify([], null, 2));
}

const readAvaliacoes = () => {
  try {
    const data = fs.readFileSync(avaliacoesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler avaliações:', error);
    return [];
  }
};

const writeAvaliacoes = (avaliacoes) => {
  try {
    fs.writeFileSync(avaliacoesPath, JSON.stringify(avaliacoes, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar avaliações:', error);
    return false;
  }
};

export const createAvaliacao = async (avaliacaoData) => {
  const avaliacoes = readAvaliacoes();
  const novaAvaliacao = {
    id: Date.now().toString(),
    ...avaliacaoData,
    dataAvaliacao: new Date().toISOString()
  };
  
  avaliacoes.push(novaAvaliacao);
  
  if (writeAvaliacoes(avaliacoes)) {
    return novaAvaliacao;
  } else {
    throw new Error('Erro ao salvar avaliação');
  }
};

export const getAllAvaliacoes = async () => {
  return readAvaliacoes();
};

export const getAvaliacaoById = async (id) => {
  const avaliacoes = readAvaliacoes();
  return avaliacoes.find(avaliacao => avaliacao.id === id);
};

export const updateAvaliacao = async (id, avaliacaoData) => {
  const avaliacoes = readAvaliacoes();
  const index = avaliacoes.findIndex(avaliacao => avaliacao.id === id);
  
  if (index === -1) {
    return null;
  }
  
  avaliacoes[index] = {
    ...avaliacoes[index],
    ...avaliacaoData,
    id, // Garantir que o ID não seja alterado
    dataAtualizacao: new Date().toISOString()
  };
  
  if (writeAvaliacoes(avaliacoes)) {
    return avaliacoes[index];
  } else {
    throw new Error('Erro ao atualizar avaliação');
  }
};

export const deleteAvaliacao = async (id) => {
  const avaliacoes = readAvaliacoes();
  const index = avaliacoes.findIndex(avaliacao => avaliacao.id === id);
  
  if (index === -1) {
    return false;
  }
  
  avaliacoes.splice(index, 1);
  
  return writeAvaliacoes(avaliacoes);
};
