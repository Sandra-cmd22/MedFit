import "./ModalAcoesCliente.css";

const ModalAcoesCliente = ({ cliente, isOpen, onClose, onEditarDados, onToggleStatus }) => {
  if (!isOpen || !cliente) return null;

  const nomeCompleto = `${cliente.nome}${cliente.sobrenome ? " " + cliente.sobrenome : ""}`;
  const isAtivo = cliente.status !== false; // Por padrão, considera ativo se status não for explicitamente false

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Ações do cliente</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <span
              className="material-symbols-rounded"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              close
            </span>
          </button>
        </div>

        <p className="modal-subtitle">
          O que deseja fazer com <strong>{nomeCompleto}</strong>?
        </p>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-primary" onClick={onEditarDados}>
            <span className="material-symbols-rounded">edit</span>
            Editar dados
          </button>

          <button
            className={`modal-btn ${isAtivo ? "modal-btn-warning" : "modal-btn-success"}`}
            onClick={onToggleStatus}
          >
            <span className="material-symbols-rounded">
              {isAtivo ? "person_off" : "person"}
            </span>
            {isAtivo ? "Tornar cliente inativo" : "Tornar cliente ativo"}
          </button>

          <button className="modal-btn modal-btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAcoesCliente;

