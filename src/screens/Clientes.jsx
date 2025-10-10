import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";

// Firebase
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase.config.js";

const Clientes = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Busca clientes no Firestore
  const loadClientes = async () => {
    setLoading(true);
    try {
      const clientesRef = collection(db, "clientes");
      const snapshot = await getDocs(clientesRef);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  // 🔹 Filtra clientes baseado na busca
  const filteredClientes = useMemo(() => {
    if (!query.trim()) return clientes;
    return clientes.filter((cliente) =>
      cliente.nome?.toLowerCase().includes(query.toLowerCase())
    );
  }, [clientes, query]);

  return (
    <div className="min-h-screen bg-white font-poppins p-4 pb-24">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-3 p-2 hover:bg-gray-100 rounded-full"
        >
          <span className="material-symbols-rounded text-xl text-gray-600">
            arrow_back
          </span>
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
      </div>

      {/* Barra de busca */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Buscar Cliente por Nome</p>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder=""
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-14 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{height: '48px'}}
          />
          <span className="material-symbols-rounded absolute text-gray-400 pointer-events-none z-10" style={{fontSize: '20px', left: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'white', padding: '2px 4px', borderRadius: '4px'}}>
            search
          </span>
        </div>
      </div>

      {/* Tabela de clientes */}
      {filteredClientes.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-rounded text-6xl text-gray-300 mb-4 block">
            person_search
          </span>
          <p className="text-gray-500 text-lg">
            {query ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {query ? 'Tente outro termo de busca' : 'Cadastre seu primeiro cliente'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table-responsive">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Idade</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((cliente) => (
                <tr
                  key={cliente.id}
                  onClick={() => {
                    localStorage.setItem("medfit_user_name", cliente.nome);
                    navigate("/home", { state: { name: cliente.nome } });
                  }}
                >
                  <td className="name-cell">
                    <div className="name-container">
                      <div className="name-text">{cliente.nome}</div>
                    </div>
                  </td>
                  <td>{cliente.idade || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Clientes;
