import db from "../db/index.js";

export const clientesRepo = {
  /**
   * Lista todos os clientes
   */
  findAll() {
    return db.prepare("SELECT * FROM clientes ORDER BY nome").all();
  },

  /**
   * Busca cliente por ID
   */
  findById(id) {
    return db.prepare("SELECT * FROM clientes WHERE id = ?").get(id);
  },

  /**
   * Busca cliente por nome (fuzzy search)
   */
  findByNome(nome) {
    return db.prepare("SELECT * FROM clientes WHERE nome LIKE ? ORDER BY nome").all(`%${nome}%`);
  },

  /**
   * Cria um novo cliente
   */
  create(cliente) {
    const stmt = db.prepare(`
      INSERT INTO clientes (nome, telefone, nascimento, sexo)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      cliente.nome,
      cliente.telefone || null,
      cliente.nascimento || null,
      cliente.sexo || null
    );
    
    return { id: result.lastInsertRowid, ...cliente };
  },

  /**
   * Atualiza um cliente
   */
  update(id, cliente) {
    const stmt = db.prepare(`
      UPDATE clientes 
      SET nome = ?, telefone = ?, nascimento = ?, sexo = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      cliente.nome,
      cliente.telefone || null,
      cliente.nascimento || null,
      cliente.sexo || null,
      id
    );
    
    return result.changes > 0;
  },

  /**
   * Remove um cliente
   */
  delete(id) {
    const result = db.prepare("DELETE FROM clientes WHERE id = ?").run(id);
    return result.changes > 0;
  },

  /**
   * Conta total de clientes
   */
  count() {
    return db.prepare("SELECT COUNT(*) as total FROM clientes").get().total;
  }
}; 