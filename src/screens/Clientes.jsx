import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalAcoesCliente from "../components/ModalAcoesCliente.jsx";
import "./Clientes.css";

// Firebase
import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { formatAltura } from "../utils/indices.js";

const FILTROS = [
  { key: "todos", label: "Todos" },
  { key: "ativos", label: "Ativos" },
  { key: "inativos", label: "Inativos" },
];

const Clientes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  // 🔹 Busca clientes no Firestore
  const loadClientes = async () => {
    setLoading(true);
    try {
      const clientesRef = collection(db, "clientes");
      const snapshot = await getDocs(clientesRef);
      const data = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));
      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const totais = useMemo(() => {
    const inativos = clientes.filter((c) => c.status === false).length;
    return { todos: clientes.length, ativos: clientes.length - inativos, inativos };
  }, [clientes]);

  const clients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const porNome = q
      ? clientes.filter((c) =>
          `${c.nome} ${c.sobrenome || ""}`.toLowerCase().includes(q)
        )
      : clientes;

    const base = porNome.filter((c) => {
      if (filtroStatus === "ativos") return c.status !== false;
      if (filtroStatus === "inativos") return c.status === false;
      return true;
    });

    return base
      .slice()
      .sort((a, b) => {
        const aName = `${a?.nome || ""} ${a?.sobrenome || ""}`.trim();
        const bName = `${b?.nome || ""} ${b?.sobrenome || ""}`.trim();

        const cmp = aName.localeCompare(bName, "pt-BR", { sensitivity: "base" });
        if (cmp !== 0) return cmp;
        return String(a?.id || "").localeCompare(String(b?.id || ""));
      });
  }, [searchTerm, filtroStatus, clientes]);

  const goToHome = (c) => {
    const fullName = `${c.nome}${c.sobrenome ? " " + c.sobrenome : ""}`;
    localStorage.setItem("medfit_user_name", fullName);
    navigate("/home", {
      state: { name: fullName, newEntry: { peso: c.peso, altura: c.altura } },
    });
  };

  // Abre o modal de ações ao clicar no botão de editar
  const handleEditClick = (cliente) => {
    setClienteSelecionado(cliente);
    setModalOpen(true);
  };

  // Redireciona para a tela de edição
  const handleEditarDados = () => {
    if (!clienteSelecionado) return;

    const fullName = `${clienteSelecionado.nome}${
      clienteSelecionado.sobrenome ? " " + clienteSelecionado.sobrenome : ""
    }`;

    localStorage.setItem("medfit_user_name", fullName);

    setModalOpen(false);
    navigate("/avaliacao", {
      state: {
        name: fullName,
        clienteData: clienteSelecionado,
        clienteId: clienteSelecionado.id,
        from: "clientes",
      },
    });
  };

  // Alterna o status do cliente (ativo/inativo)
  const toggleClientStatus = async () => {
    if (!clienteSelecionado) return;

    try {
      const clienteRef = doc(db, "clientes", clienteSelecionado.id);
      const novoStatus = clienteSelecionado.status !== false ? false : true;
      
      await updateDoc(clienteRef, { status: novoStatus });
      
      // Atualiza o estado local
      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteSelecionado.id
            ? { ...c, status: novoStatus }
            : c
        )
      );

      setModalOpen(false);
      setClienteSelecionado(null);
    } catch (error) {
      console.error("Erro ao alterar status do cliente:", error);
      alert("Não foi possível alterar o status do cliente. Tente novamente.");
    }
  };

  const handleDelete = async (cliente) => {
    const confirmation = window.confirm(
      `Tem certeza de que deseja remover o cliente ${cliente.nome}?`
    );

    if (!confirmation) return;

    try {
      await deleteDoc(doc(db, "clientes", cliente.id));
      setClientes((prev) => prev.filter((item) => item.id !== cliente.id));
    } catch (error) {
      console.error("Erro ao apagar cliente:", error);
      alert("Não foi possível apagar o cliente. Tente novamente.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">
            {totais.todos} clientes cadastrados · {totais.ativos} ativos
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-outline btn-icon"
            onClick={loadClientes}
            disabled={loading}
            title="Recarregar lista"
          >
            <span className="material-symbols-rounded">refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/cadastro")}
          >
            <span className="material-symbols-rounded">person_add</span>
            Cadastrar cliente
          </button>
        </div>
      </div>

      <div className="panel clientes-panel">
        <div className="clientes-toolbar">
          <div className="search-input">
            <span className="material-symbols-rounded">search</span>
            <input
              id="search"
              className="input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente por nome"
            />
          </div>

          <div className="segmented">
            {FILTROS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`segmented-item${filtroStatus === f.key ? " active" : ""}`}
                onClick={() => setFiltroStatus(f.key)}
              >
                {f.label}
                <span className="segmented-count">{totais[f.key]}</span>
              </button>
            ))}
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th className="num">Idade</th>
              <th>Sexo</th>
              <th className="num">Altura</th>
              <th className="num">Peso (kg)</th>
              <th>Status</th>
              <th className="actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="clientes-table-msg">
                  Carregando clientes...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan="7" className="clientes-table-msg">
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : (
              clients.map((c) => {
                const isInativo = c.status === false;
                const nomeCompleto = `${c.nome}${c.sobrenome ? " " + c.sobrenome : ""}`;
                return (
                  <tr key={c.id} className={isInativo ? "cliente-inativo" : ""}>
                    <td>
                      <button
                        type="button"
                        className="cliente-nome"
                        onClick={() => goToHome(c)}
                        title="Abrir painel do cliente"
                      >
                        <span className="cliente-avatar">
                          {(c.nome || "?").trim().charAt(0).toUpperCase()}
                        </span>
                        {nomeCompleto.toLowerCase()}
                      </button>
                    </td>
                    <td className="num">{c.idade || "-"}</td>
                    <td>{c.sexo || "-"}</td>
                    <td className="num">{formatAltura(c.altura)}</td>
                    <td className="num">{c.peso || "-"}</td>
                    <td>
                      <span className={`badge ${isInativo ? "badge-gray" : "badge-green"}`}>
                        {isInativo ? "Inativo" : "Ativo"}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        type="button"
                        className="icon-action"
                        onClick={() => goToHome(c)}
                        title="Abrir painel"
                      >
                        <span className="material-symbols-rounded">visibility</span>
                      </button>
                      <button
                        type="button"
                        className="icon-action"
                        onClick={() => handleEditClick(c)}
                        title="Editar ou alterar status"
                      >
                        <span className="material-symbols-rounded">edit</span>
                      </button>
                      <button
                        type="button"
                        className="icon-action danger"
                        onClick={() => handleDelete(c)}
                        title="Apagar cliente"
                      >
                        <span className="material-symbols-rounded">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ModalAcoesCliente
        cliente={clienteSelecionado}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setClienteSelecionado(null);
        }}
        onEditarDados={handleEditarDados}
        onToggleStatus={toggleClientStatus}
      />
    </div>
  );
};

export default Clientes;
