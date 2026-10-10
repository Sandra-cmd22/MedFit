/**
 * Controla o carregamento do cliente e das avaliações exibidos no Painel.
 * Só lê dados (via `buscarCliente` / `buscarAvaliacoes`) e repassa o estado da tela em `aplicar`.
 * Respostas de buscas antigas, concluídas depois de uma nova seleção, são descartadas.
 */
export const criarCarregadorAluno = ({ buscarCliente, buscarAvaliacoes, aplicar }) => {
  let requisicaoAtual = 0;
  let alunoAtual = null;

  const carregar = async (aluno) => {
    requisicaoAtual += 1;
    const requisicao = requisicaoAtual;
    const ehAtual = () => requisicao === requisicaoAtual;

    if (aluno !== alunoAtual) {
      alunoAtual = aluno;
      aplicar({ avaliacoes: [], carregandoAvaliacoes: true, erroAvaliacoes: false });
    } else {
      aplicar({ carregandoAvaliacoes: true });
    }

    let cliente;
    try {
      cliente = await buscarCliente(aluno);
    } catch (error) {
      if (!ehAtual()) return { status: "obsoleta" };
      aplicar({ avaliacoes: [], carregandoAvaliacoes: false, erroAvaliacoes: true });
      return { status: "erro", etapa: "cliente", error };
    }

    if (!ehAtual()) return { status: "obsoleta" };

    if (!cliente) {
      aplicar({ avaliacoes: [], carregandoAvaliacoes: false, erroAvaliacoes: false });
      return { status: "sem-cliente" };
    }

    aplicar({ cliente: cliente.data });

    let avaliacoes;
    try {
      avaliacoes = await buscarAvaliacoes(aluno, cliente.id);
    } catch (error) {
      if (!ehAtual()) return { status: "obsoleta" };
      aplicar({ avaliacoes: [], carregandoAvaliacoes: false, erroAvaliacoes: true });
      return { status: "erro", etapa: "avaliacoes", error };
    }

    if (!ehAtual()) return { status: "obsoleta" };

    aplicar({
      avaliacoes: Array.isArray(avaliacoes) ? avaliacoes : [],
      carregandoAvaliacoes: false,
      erroAvaliacoes: false,
    });
    return { status: "ok" };
  };

  const cancelar = () => {
    requisicaoAtual += 1;
    alunoAtual = null;
  };

  return { carregar, cancelar };
};
