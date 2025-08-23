import db from "../db/index.js";
import { imc, rcq, classificaIMC, classificaRCQ } from "../utils/calc.js";

export const avaliacoesRepo = {
  /**
   * Lista todas as avaliações
   */
  findAll() {
    const avaliacoes = db.prepare(`
      SELECT a.*, c.nome as cliente_nome, c.sexo as cliente_sexo
      FROM avaliacoes a
      JOIN clientes c ON a.cliente_id = c.id
      ORDER BY a.data DESC
    `).all();
    
    return avaliacoes.map(av => ({
      ...av,
      imc: imc(av.peso, av.altura),
      rcq: rcq(av.cintura, av.quadril),
      imc_classificacao: classificaIMC(imc(av.peso, av.altura)),
      rcq_classificacao: classificaRCQ(av.cliente_sexo, rcq(av.cintura, av.quadril))
    }));
  },

  /**
   * Busca avaliação por ID
   */
  findById(id) {
    const avaliacao = db.prepare(`
      SELECT a.*, c.nome as cliente_nome, c.sexo as cliente_sexo
      FROM avaliacoes a
      JOIN clientes c ON a.cliente_id = c.id
      WHERE a.id = ?
    `).get(id);
    
    if (!avaliacao) return null;
    
    return {
      ...avaliacao,
      imc: imc(avaliacao.peso, avaliacao.altura),
      rcq: rcq(avaliacao.cintura, avaliacao.quadril),
      imc_classificacao: classificaIMC(imc(avaliacao.peso, avaliacao.altura)),
      rcq_classificacao: classificaRCQ(avaliacao.cliente_sexo, rcq(avaliacao.cintura, avaliacao.quadril))
    };
  },

  /**
   * Lista avaliações de um cliente
   */
  findByClienteId(clienteId) {
    const avaliacoes = db.prepare(`
      SELECT a.*, c.nome as cliente_nome, c.sexo as cliente_sexo
      FROM avaliacoes a
      JOIN clientes c ON a.cliente_id = c.id
      WHERE a.cliente_id = ?
      ORDER BY a.data DESC
    `).all(clienteId);
    
    return avaliacoes.map(av => ({
      ...av,
      imc: imc(av.peso, av.altura),
      rcq: rcq(av.cintura, av.quadril),
      imc_classificacao: classificaIMC(imc(av.peso, av.altura)),
      rcq_classificacao: classificaRCQ(av.cliente_sexo, rcq(av.cintura, av.quadril))
    }));
  },

  /**
   * Busca última avaliação de um cliente
   */
  findLastByClienteId(clienteId) {
    const avaliacao = db.prepare(`
      SELECT a.*, c.nome as cliente_nome, c.sexo as cliente_sexo
      FROM avaliacoes a
      JOIN clientes c ON a.cliente_id = c.id
      WHERE a.cliente_id = ?
      ORDER BY a.data DESC
      LIMIT 1
    `).get(clienteId);
    
    if (!avaliacao) return null;
    
    return {
      ...avaliacao,
      imc: imc(avaliacao.peso, avaliacao.altura),
      rcq: rcq(avaliacao.cintura, avaliacao.quadril),
      imc_classificacao: classificaIMC(imc(avaliacao.peso, avaliacao.altura)),
      rcq_classificacao: classificaRCQ(avaliacao.cliente_sexo, rcq(avaliacao.cintura, avaliacao.quadril))
    };
  },

  /**
   * Cria uma nova avaliação
   */
  create(avaliacao) {
    const stmt = db.prepare(`
      INSERT INTO avaliacoes (
        cliente_id, data, peso, altura, cintura, quadril, 
        gordura_corporal, braco, coxa, observacoes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      avaliacao.cliente_id,
      avaliacao.data,
      avaliacao.peso,
      avaliacao.altura,
      avaliacao.cintura || null,
      avaliacao.quadril || null,
      avaliacao.gordura_corporal || null,
      avaliacao.braco || null,
      avaliacao.coxa || null,
      avaliacao.observacoes || null
    );
    
    return this.findById(result.lastInsertRowid);
  },

  /**
   * Atualiza uma avaliação
   */
  update(id, avaliacao) {
    const stmt = db.prepare(`
      UPDATE avaliacoes 
      SET data = ?, peso = ?, altura = ?, cintura = ?, quadril = ?,
          gordura_corporal = ?, braco = ?, coxa = ?, observacoes = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      avaliacao.data,
      avaliacao.peso,
      avaliacao.altura,
      avaliacao.cintura || null,
      avaliacao.quadril || null,
      avaliacao.gordura_corporal || null,
      avaliacao.braco || null,
      avaliacao.coxa || null,
      avaliacao.observacoes || null,
      id
    );
    
    return result.changes > 0 ? this.findById(id) : null;
  },

  /**
   * Remove uma avaliação
   */
  delete(id) {
    const result = db.prepare("DELETE FROM avaliacoes WHERE id = ?").run(id);
    return result.changes > 0;
  },

  /**
   * Conta total de avaliações
   */
  count() {
    return db.prepare("SELECT COUNT(*) as total FROM avaliacoes").get().total;
  },

  /**
   * Busca avaliações por período
   */
  findByPeriodo(dataInicio, dataFim) {
    const avaliacoes = db.prepare(`
      SELECT a.*, c.nome as cliente_nome, c.sexo as cliente_sexo
      FROM avaliacoes a
      JOIN clientes c ON a.cliente_id = c.id
      WHERE a.data BETWEEN ? AND ?
      ORDER BY a.data DESC
    `).all(dataInicio, dataFim);
    
    return avaliacoes.map(av => ({
      ...av,
      imc: imc(av.peso, av.altura),
      rcq: rcq(av.cintura, av.quadril),
      imc_classificacao: classificaIMC(imc(av.peso, av.altura)),
      rcq_classificacao: classificaRCQ(av.cliente_sexo, rcq(av.cintura, av.quadril))
    }));
  }
}; 