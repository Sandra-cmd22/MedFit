const ModalAcoesCliente = ({ cliente, isOpen, onClose, onEditarDados, onToggleStatus }) => {
  if (!isOpen || !cliente) return null;

  const nomeCompleto = `${cliente.nome}${cliente.sobrenome ? " " + cliente.sobrenome : ""}`;
  const isAtivo = cliente.status !== false; // Por padrão, considera ativo se status não for explicitamente false

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ações do cliente</h2>
          <button type="button" className="icon-action" onClick={onClose} title="Fechar">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <p className="modal-body">
          O que deseja fazer com <strong>{nomeCompleto}</strong>?
        </p>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onToggleStatus}
          >
            <span className="material-symbols-rounded">
              {isAtivo ? "person_off" : "person"}
            </span>
            {isAtivo ? "Tornar inativo" : "Tornar ativo"}
          </button>
          <button type="button" className="btn btn-dark" onClick={onEditarDados}>
            <span className="material-symbols-rounded">edit</span>
            Editar dados
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAcoesCliente;
