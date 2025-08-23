PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  telefone TEXT,
  nascimento TEXT,
  sexo TEXT, -- "F", "M" ou "O"
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  data TEXT NOT NULL, -- ISO yyyy-mm-dd
  peso REAL NOT NULL, -- kg
  altura REAL NOT NULL, -- metros
  cintura REAL, -- cm
  quadril REAL, -- cm
  gordura_corporal REAL, -- %
  braco REAL, -- cm (opcional)
  coxa REAL,  -- cm (opcional)
  observacoes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_cliente ON avaliacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes(data); 