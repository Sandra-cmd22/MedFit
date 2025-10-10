import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase.config.js";

const Historico = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clienteData, setClienteData] = useState(
    location?.state?.clienteData || null
  );
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const userName = location?.state?.userName || "Cliente";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Buscar dados do cliente
        const clientesRef = collection(db, "clientes");
        const qCliente = query(clientesRef, where("nome", "==", userName));
        const clienteSnapshot = await getDocs(qCliente);

        if (!clienteSnapshot.empty) {
          const clienteDoc = clienteSnapshot.docs[0];
          const clienteData = { id: clienteDoc.id, ...clienteDoc.data() };
          setClienteData(clienteData);
        }

        // Buscar avaliações do cliente
        const avaliacoesRef = collection(db, "avaliacoes");
        const qAvaliacoes = query(
          avaliacoesRef,
          where("clienteNome", "==", userName),
          orderBy("dataAvaliacao", "desc")
        );
        const avaliacoesSnapshot = await getDocs(qAvaliacoes);

        const avaliacoesData = avaliacoesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAvaliacoes(avaliacoesData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userName]);

  const formatDate = (dateString) => {
    if (!dateString) return "Data não disponível";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch (error) {
      return "Data inválida";
    }
  };

  const formatarNomeMedida = (key) => {
    const nomes = {
      bracoDireito: "Braço Direito",
      bracoEsquerdo: "Braço Esquerdo", 
      bracoForcaDireito: "Braço (força) Direito",
      bracoForcaEsquerdo: "Braço (força) Esquerdo",
      antebracoDireito: "Antebraço Direito",
      antebracoEsquerdo: "Antebraço Esquerdo",
      torax: "Tórax",
      abdomen: "Abdômen",
      cintura: "Cintura",
      quadril: "Quadril",
      coxaProximalDireita: "Coxa Proximal Direita",
      coxaProximalEsquerda: "Coxa Proximal Esquerda",
      coxaDistalDireita: "Coxa Distal Direita",
      coxaDistalEsquerda: "Coxa Distal Esquerda",
      panturrilhaDireita: "Panturrilha Direita",
      panturrilhaEsquerda: "Panturrilha Esquerda"
    };
    return nomes[key] || key;
  };

  const compartilharWhatsApp = () => {
    if (!clienteData?.medidas) return;
    
    let mensagem = `📊 *Histórico de Avaliação - ${userName}*\n\n`;
    mensagem += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    mensagem += `📏 *Medidas Corporais:*\n`;
    
    Object.entries(clienteData.medidas).forEach(([key, value]) => {
      if (value && value !== "0" && value !== "") {
        mensagem += `• ${formatarNomeMedida(key)}: ${value}cm\n`;
      }
    });
    
    if (clienteData.idade) mensagem += `\n👤 Idade: ${clienteData.idade} anos`;
    if (clienteData.peso) mensagem += `\n⚖️ Peso: ${clienteData.peso} kg`;
    if (clienteData.altura) mensagem += `\n📏 Altura: ${clienteData.altura} cm`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-poppins p-4 pb-20">
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-rounded text-4xl text-blue-700 animate-spin">
            refresh
          </span>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-poppins p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button 
          className="text-2xl text-gray-700" 
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Histórico Completo</h1>
      </div>

      {/* Informações do Cliente */}
      {clienteData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-2">{userName}</h2>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
            {clienteData.idade && <div>Idade: {clienteData.idade} anos</div>}
            {clienteData.altura && <div>Altura: {clienteData.altura} cm</div>}
            {clienteData.peso && <div>Peso: {clienteData.peso} kg</div>}
            {clienteData.sexo && <div>Sexo: {clienteData.sexo}</div>}
          </div>
        </div>
      )}

      {/* Comparação de Medidas */}
      {clienteData?.medidas && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparação de Medidas</h3>
          
          {avaliacoes.length > 0 ? (
            <div className="space-y-3">
              {Object.entries(clienteData.medidas).map(([key, value]) => {
                if (!value || value === "0" || value === "") return null;
                
                const medidaAnterior = avaliacoes[0]?.medidas?.[key];
                
                return (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-700 font-medium text-sm">
                      {formatarNomeMedida(key)}
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      {medidaAnterior && medidaAnterior !== "0" && medidaAnterior !== "" && (
                        <>
                          <span className="text-red-600 font-medium">
                            {medidaAnterior}cm
                          </span>
                          <span className="text-gray-400">→</span>
                        </>
                      )}
                      <span className="text-green-600 font-semibold">
                        {value}cm
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(clienteData.medidas).map(([key, value]) => {
                if (!value || value === "0" || value === "") return null;
                
                return (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-700 font-medium text-sm">
                      {formatarNomeMedida(key)}
                    </span>
                    <span className="text-green-600 font-semibold text-sm">
                      {value}cm
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span>Medida Atual</span>
              </div>
              {avaliacoes.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span>Medida Anterior</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Avaliações */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Avaliações</h3>
        
        {avaliacoes.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-rounded text-4xl text-gray-300 mb-2 block">
              assignment
            </span>
            <p className="text-gray-500">Nenhuma avaliação encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {avaliacoes.map((avaliacao, index) => (
              <div key={avaliacao.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">
                    Avaliação {index + 1}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {formatDate(avaliacao.dataAvaliacao)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <div className="grid grid-cols-2 gap-2">
                    {avaliacao.dadosBasicos?.idade && (
                      <div>Idade: {avaliacao.dadosBasicos.idade} anos</div>
                    )}
                    {avaliacao.dadosBasicos?.peso && (
                      <div>Peso: {avaliacao.dadosBasicos.peso} kg</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão Compartilhar WhatsApp */}
      <div style={{ marginTop: '24px', marginBottom: '80px' }}>
        <button
          onClick={compartilharWhatsApp}
          style={{
            width: '100%',
            backgroundColor: 'white',
            border: '2px solid #16a34a',
            color: '#16a34a',
            borderRadius: '8px',
            height: '48px',
            padding: '0 16px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          <svg width="20" height="20" fill="#16a34a" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
          Compartilhar por WhatsApp
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Historico;
