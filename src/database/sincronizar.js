// Script de sincronização de clientes com Firestore (projeto: MedFit)
// Funciona em Node.js (>=18) e no frontend

import * as api from './api.js';
import { salvarCliente as salvarClienteFirestore } from './clientes.js';

// Obtém clientes da API usando a melhor função disponível no módulo api.js
async function obterClientesDaAPI() {
  // Tente funções nomeadas comuns
  const candidates = [
    'fetchClientes',
    'listarClientes',
    'getClientes',
    'buscarClientes',
  ];

  for (const fn of candidates) {
    if (typeof api[fn] === 'function') {
      return await api[fn]();
    }
  }

  // Fallback: tentar via HTTP GET no endpoint padrão
  const endpoint = '/api/clientes';
  const isBrowser = typeof window !== 'undefined' && typeof window.fetch === 'function';
  const runtimeFetch = (typeof fetch === 'function') ? fetch : (isBrowser ? window.fetch : null);

  if (!runtimeFetch) {
    throw new Error('Nenhuma função de API disponível e fetch indisponível neste ambiente.');
  }

  const res = await runtimeFetch(endpoint);
  if (!res.ok) {
    throw new Error(`Falha ao buscar clientes: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

export async function sincronizarClientes() {
  const resultado = {
    totalObtidos: 0,
    salvosComSucesso: 0,
    falhasAoSalvar: 0,
    erros: [],
  };

  try {
    const clientes = await obterClientesDaAPI();
    if (!Array.isArray(clientes)) {
      throw new Error('A API não retornou uma lista de clientes.');
    }
    resultado.totalObtidos = clientes.length;

    for (const cliente of clientes) {
      try {
        const payload = {
          ...cliente,
          dataSalvo: new Date().toISOString(),
        };
        // Salva no Firestore (projeto MedFit, credenciais devem estar configuradas em clientes.js)
        await salvarClienteFirestore(payload, 'clientes');
        resultado.salvosComSucesso += 1;
      } catch (erroSalvar) {
        resultado.falhasAoSalvar += 1;
        resultado.erros.push({ tipo: 'salvar', mensagem: String(erroSalvar), cliente });
        // Continua com os próximos clientes
      }
    }

    return resultado;
  } catch (erroAPI) {
    resultado.erros.push({ tipo: 'api', mensagem: String(erroAPI) });
    throw erroAPI;
  }
}

// Execução direta (Node.js)
if (typeof window === 'undefined') {
  (async () => {
    try {
      const r = await sincronizarClientes();
      console.log('Sincronização concluída:', r);
      process.exitCode = 0;
    } catch (e) {
      console.error('Erro na sincronização:', e);
      process.exitCode = 1;
    }
  })();
}


