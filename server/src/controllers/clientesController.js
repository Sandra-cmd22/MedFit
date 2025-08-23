import { clientesRepo } from "../repositories/clientesRepo.js";

export const clientesController = {
  /**
   * GET /api/clientes - Lista todos os clientes
   */
  async listarTodos(req, res) {
    try {
      const clientes = clientesRepo.findAll();
      res.json({
        success: true,
        data: clientes,
        total: clientes.length
      });
    } catch (error) {
      console.error("Erro ao listar clientes:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * GET /api/clientes/:id - Busca cliente por ID
   */
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const cliente = clientesRepo.findById(parseInt(id));
      
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado"
        });
      }
      
      res.json({
        success: true,
        data: cliente
      });
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * GET /api/clientes/buscar?nome=... - Busca clientes por nome
   */
  async buscarPorNome(req, res) {
    try {
      const { nome } = req.query;
      
      if (!nome) {
        return res.status(400).json({
          success: false,
          message: "Parâmetro 'nome' é obrigatório"
        });
      }
      
      const clientes = clientesRepo.findByNome(nome);
      res.json({
        success: true,
        data: clientes,
        total: clientes.length
      });
    } catch (error) {
      console.error("Erro ao buscar clientes por nome:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * POST /api/clientes - Cria novo cliente
   */
  async criar(req, res) {
    try {
      const { nome, telefone, nascimento, sexo } = req.body;
      
      if (!nome) {
        return res.status(400).json({
          success: false,
          message: "Nome é obrigatório"
        });
      }
      
      const novoCliente = clientesRepo.create({
        nome,
        telefone,
        nascimento,
        sexo
      });
      
      res.status(201).json({
        success: true,
        data: novoCliente,
        message: "Cliente criado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * PUT /api/clientes/:id - Atualiza cliente
   */
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, telefone, nascimento, sexo } = req.body;
      
      if (!nome) {
        return res.status(400).json({
          success: false,
          message: "Nome é obrigatório"
        });
      }
      
      const clienteExistente = clientesRepo.findById(parseInt(id));
      if (!clienteExistente) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado"
        });
      }
      
      const sucesso = clientesRepo.update(parseInt(id), {
        nome,
        telefone,
        nascimento,
        sexo
      });
      
      if (sucesso) {
        const clienteAtualizado = clientesRepo.findById(parseInt(id));
        res.json({
          success: true,
          data: clienteAtualizado,
          message: "Cliente atualizado com sucesso"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Erro ao atualizar cliente"
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * DELETE /api/clientes/:id - Remove cliente
   */
  async remover(req, res) {
    try {
      const { id } = req.params;
      
      const clienteExistente = clientesRepo.findById(parseInt(id));
      if (!clienteExistente) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado"
        });
      }
      
      const sucesso = clientesRepo.delete(parseInt(id));
      
      if (sucesso) {
        res.json({
          success: true,
          message: "Cliente removido com sucesso"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Erro ao remover cliente"
        });
      }
    } catch (error) {
      console.error("Erro ao remover cliente:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  },

  /**
   * GET /api/clientes/stats - Estatísticas dos clientes
   */
  async estatisticas(req, res) {
    try {
      const total = clientesRepo.count();
      
      res.json({
        success: true,
        data: {
          total_clientes: total
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