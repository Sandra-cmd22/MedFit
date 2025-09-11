import { createAvaliacao as createAvaliacaoRepo, getAllAvaliacoes as getAllAvaliacoesRepo, getAvaliacaoById as getAvaliacaoByIdRepo, updateAvaliacao as updateAvaliacaoRepo, deleteAvaliacao as deleteAvaliacaoRepo } from '../repositories/avaliacoesRepo.js';

export const createAvaliacao = async (req, res) => {
  try {
    const avaliacaoData = {
      ...req.body,
      dataAvaliacao: new Date().toISOString()
    };
    
    const avaliacao = await createAvaliacaoRepo(avaliacaoData);
    res.status(201).json(avaliacao);
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const getAllAvaliacoes = async (req, res) => {
  try {
    const avaliacoes = await getAllAvaliacoesRepo();
    res.json(avaliacoes);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const getAvaliacaoById = async (req, res) => {
  try {
    const { id } = req.params;
    const avaliacao = await getAvaliacaoByIdRepo(id);
    
    if (!avaliacao) {
      return res.status(404).json({ erro: 'Avaliação não encontrada' });
    }
    
    res.json(avaliacao);
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const updateAvaliacao = async (req, res) => {
  try {
    const { id } = req.params;
    const avaliacaoData = req.body;
    
    const avaliacao = await updateAvaliacaoRepo(id, avaliacaoData);
    
    if (!avaliacao) {
      return res.status(404).json({ erro: 'Avaliação não encontrada' });
    }
    
    res.json(avaliacao);
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const deleteAvaliacao = async (req, res) => {
  try {
    const { id } = req.params;
    const sucesso = await deleteAvaliacaoRepo(id);
    
    if (!sucesso) {
      return res.status(404).json({ erro: 'Avaliação não encontrada' });
    }
    
    res.json({ mensagem: 'Avaliação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};
