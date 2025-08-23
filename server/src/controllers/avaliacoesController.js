import { avaliacoesRepo } from "../repositories/avaliacoesRepo.js";
import { clientesRepo } from "../repositories/clientesRepo.js";

export const avaliacoesController = {
  /**
   * GET /api/avaliacoes - Lista todas as avaliações
   */
  async listarTodas(req, res) {
    try {
      const avaliacoes = avaliacoesRepo.findAll();
      res.json({
        success: true,
        data: avaliacoes,
        total: avaliacoes.length
      });
    } catch (error) {
      console.error("Erro ao listar avaliações:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * GET /api/avaliacoes/:id - Busca avaliação por ID
   */
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const avaliacao = avaliacoesRepo.findById(parseInt(id));
      
      if (!avaliacao) {
        return res.status(404).json({
          success: false,
          message: "Avaliação não encontrada"
        });
      }
      
      res.json({
        success: true,
        data: avaliacao
      });
    } catch (error) {
      console.error("Erro ao buscar avaliação:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * GET /api/avaliacoes/cliente/:clienteId - Lista avaliações de um cliente
   */
  async listarPorCliente(req, res) {
    try {
      const { clienteId } = req.params;
      
      const cliente = clientesRepo.findById(parseInt(clienteId));
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado"
        });
      }
      
      const avaliacoes = avaliacoesRepo.findByClienteId(parseInt(clienteId));
      res.json({
        success: true,
        data: avaliacoes,
        cliente: cliente,
        total: avaliacoes.length
      });
    } catch (error) {
      console.error("Erro ao listar avaliações do cliente:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * GET /api/avaliacoes/cliente/:clienteId/ultima - Busca última avaliação de um cliente
   */
  async buscarUltimaPorCliente(req, res) {
    try {
      const { clienteId } = req.params;
      
      const cliente = clientesRepo.findById(parseInt(clienteId));
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado"
        });
      }
      
      const ultimaAvaliacao = avaliacoesRepo.findLastByClienteId(parseInt(clienteId));
      
      res.json({
        success: true,
        data: ultimaAvaliacao,
        cliente: cliente
      });
    } catch (error) {
      console.error("Erro ao buscar última avaliação:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * POST /api/avaliacoes - Cria nova avaliação
   */
  async criar(req, res) {
    try {
      const { 
        cliente_id, data, peso, altura, cintura, quadril, 
        gordura_corporal, braco, coxa, observacoes 
      } = req.body;
      
      // Validações básicas
      if (!cliente_id || !data || !peso || !altura) {
        return res.status(400).json({
          success: false,
          message: "cliente_id, data, peso e altura são obrigatórios"
        });
      }
      
      // Verificar se o cliente existe
      const cliente = clientesRepo.findById(parseInt(cliente_id));
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado"
        });
      }
      
      const novaAvaliacao = avaliacoesRepo.create({
        cliente_id: parseInt(cliente_id),
        data,
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        cintura: cintura ? parseFloat(cintura) : null,
        quadril: quadril ? parseFloat(quadril) : null,
        gordura_corporal: gordura_corporal ? parseFloat(gordura_corporal) : null,
        braco: braco ? parseFloat(braco) : null,
        coxa: coxa ? parseFloat(coxa) : null,
        observacoes
      });
      
      res.status(201).json({
        success: true,
        data: novaAvaliacao,
        message: "Avaliação criada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao criar avaliação:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * PUT /api/avaliacoes/:id - Atualiza avaliação
   */
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { 
        data, peso, altura, cintura, quadril, 
        gordura_corporal, braco, coxa, observacoes 
      } = req.body;
      
      // Validações básicas
      if (!data || !peso || !altura) {
        return res.status(400).json({
          success: false,
          message: "data, peso e altura são obrigatórios"
        });
      }
      
      const avaliacaoExistente = avaliacoesRepo.findById(parseInt(id));
      if (!avaliacaoExistente) {
        return res.status(404).json({
          success: false,
          message: "Avaliação não encontrada"
        });
      }
      
      const avaliacaoAtualizada = avaliacoesRepo.update(parseInt(id), {
        data,
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        cintura: cintura ? parseFloat(cintura) : null,
        quadril: quadril ? parseFloat(quadril) : null,
        gordura_corporal: gordura_corporal ? parseFloat(gordura_corporal) : null,
        braco: braco ? parseFloat(braco) : null,
        coxa: coxa ? parseFloat(coxa) : null,
        observacoes
      });
      
      if (avaliacaoAtualizada) {
        res.json({
          success: true,
          data: avaliacaoAtualizada,
          message: "Avaliação atualizada com sucesso"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Erro ao atualizar avaliação"
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar avaliação:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * DELETE /api/avaliacoes/:id - Remove avaliação
   */
  async remover(req, res) {
    try {
      const { id } = req.params;
      
      const avaliacaoExistente = avaliacoesRepo.findById(parseInt(id));
      if (!avaliacaoExistente) {
        return res.status(404).json({
          success: false,
          message: "Avaliação não encontrada"
        });
      }
      
      const sucesso = avaliacoesRepo.delete(parseInt(id));
      
      if (sucesso) {
        res.json({
          success: true,
          message: "Avaliação removida com sucesso"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Erro ao remover avaliação"
        });
      }
    } catch (error) {
      console.error("Erro ao remover avaliação:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * GET /api/avaliacoes/periodo?inicio=...&fim=... - Busca avaliações por período
   */
  async buscarPorPeriodo(req, res) {
    try {
      const { inicio, fim } = req.query;
      
      if (!inicio || !fim) {
        return res.status(400).json({
          success: false,
          message: "Parâmetros 'inicio' e 'fim' são obrigatórios (formato: YYYY-MM-DD)"
        });
      }
      
      const avaliacoes = avaliacoesRepo.findByPeriodo(inicio, fim);
      res.json({
        success: true,
        data: avaliacoes,
        periodo: { inicio, fim },
        total: avaliacoes.length
      });
    } catch (error) {
      console.error("Erro ao buscar avaliações por período:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * GET /api/avaliacoes/stats - Estatísticas das avaliações
   */
  async estatisticas(req, res) {
    try {
      const total = avaliacoesRepo.count();
      
      res.json({
        success: true,
        data: {
          total_avaliacoes: total
        }
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  }
}; 