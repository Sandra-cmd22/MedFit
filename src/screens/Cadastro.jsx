import { addDoc, collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase.js";
import { MEDIDAS_CAMPOS } from "../utils/indices.js";

// Funções auxiliares para formatação
const formatCPF = (value) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

const formatTelefone = (value) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 10) {
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

// "bracoDireito" -> "braco-direito" (ids lidos em handleCadastrar)
const toInputId = (key) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

const Cadastro = () => {
  const navigate = useNavigate();
  const [sexo, setSexo] = useState("");
  const [plano, setPlano] = useState("");
  const [, setClientes] = useState([]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const clientesRef = collection(db, "clientes");
        const snapshot = await getDocs(clientesRef);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClientes(data);
      } catch (error) {
        console.error("Erro ao carregar clientes do Firestore:", error);
        setClientes([]);
      }
    };

    fetchClientes();
  }, []);

  const handleCadastrar = async () => {
    try {
      const getEl = (id) => document.getElementById(id);
      const getNumber = (id) => {
        const el = getEl(id);
        if (!el) return NaN;
        const v = parseFloat((el.value || "").toString().replace(",", "."));
        return Number.isNaN(v) ? NaN : v;
      };

      const getNumberWithCommaConversion = (id) => {
        const el = getEl(id);
        if (!el) return NaN;
        const value = (el.value || "").toString().replace(",", ".");
        const v = parseFloat(value);
        return Number.isNaN(v) ? NaN : v;
      };

      const nome = (getEl("nome")?.value || "").toString().trim();
      const idade = (getEl("idade")?.value || "").toString().trim();
      const altura = getNumberWithCommaConversion("altura");
      const peso = getNumber("peso");
      // Coleta os novos campos de endereço e contato
      const endereco = (getEl("endereco")?.value || "").toString().trim();
      const bairro = (getEl("bairro")?.value || "").toString().trim();
      const numero = (getEl("numero")?.value || "").toString().trim();
      const cidade = (getEl("cidade")?.value || "").toString().trim();
      const estado = (getEl("estado")?.value || "").toString().trim().toUpperCase();
      // Remove formatação de telefone e CPF antes de salvar (apenas números)
      const telefone = (getEl("telefone")?.value || "").toString().replace(/\D/g, "").trim();
      const cpf = (getEl("cpf")?.value || "").toString().replace(/\D/g, "").trim();
      const email = (getEl("email")?.value || "").toString().trim();

      if (!nome) {
        alert("Nome é obrigatório");
        return;
      }

      if (!plano) {
        alert("Selecione o plano semanal do cliente.");
        return;
      }

      // Coletar todas as medidas
      const medidas = {
        bracoDireito: getNumber("braco-direito"),
        bracoEsquerdo: getNumber("braco-esquerdo"),
        bracoForcaDireito: getNumber("braco-forca-direito"),
        bracoForcaEsquerdo: getNumber("braco-forca-esquerdo"),
        antebracoDireito: getNumber("antebraco-direito"),
        antebracoEsquerdo: getNumber("antebraco-esquerdo"),
        torax: getNumber("torax"),
        cintura: getNumber("cintura"),
        quadril: getNumber("quadril"),
        abdomen: getNumber("abdomen"),
        coxaProximalDireita: getNumber("coxa-proximal-direita"),
        coxaProximalEsquerda: getNumber("coxa-proximal-esquerda"),
        coxaDistalDireita: getNumber("coxa-distal-direita"),
        coxaDistalEsquerda: getNumber("coxa-distal-esquerda"),
        panturrilhaDireita: getNumber("panturrilha-direita"),
        panturrilhaEsquerda: getNumber("panturrilha-esquerda"),
      };

      const cliente = {
        nome,
        idade,
        altura,
        peso,
        sexo, // certifique-se que `sexo` está definido no escopo
        plano: Number(plano),
        // Novos campos de endereço e contato (salva null se vazio)
        endereco: endereco ? endereco : null,
        bairro: bairro ? bairro : null,
        numero: numero ? numero : null,
        cidade: cidade ? cidade : null,
        estado: estado ? estado : null,
        telefone: telefone ? telefone : null,
        cpf: cpf ? cpf : null,
        email: email ? email : null,
        medidas,
        status: true, // Por padrão, clientes são criados como ativos
        dataCadastro: new Date().toISOString(),
      };

      // Debug: verificar dados antes de salvar
      console.log("Dados do cliente a serem salvos:", cliente);

      // Salvar no Firestore
      const docRef = await addDoc(collection(db, "clientes"), cliente);
      const clienteId = docRef.id;
      console.log("Cliente salvo com ID:", clienteId);

      // Criar a primeira avaliação na coleção 'avaliacoes' (avaliação inicial do cadastro)
      const dataAtual = new Date();
      const avaliacaoInicial = {
        clienteId: clienteId,
        clienteNome: nome,
        startDate: dataAtual.toISOString(),
        endDate: dataAtual.toISOString(),
        medidas: medidas,
        evaluationDate: dataAtual.toISOString(),
        idade: idade,
        peso: peso,
      };

      const avaliacoesRef = collection(db, "avaliacoes");
      await addDoc(avaliacoesRef, avaliacaoInicial);
      console.log("Avaliação inicial criada para o cadastro");

      // Salvar nome no localStorage para uso posterior
      localStorage.setItem("medfit_user_name", nome);

      // Navegar para home
      navigate("/home", {
        state: {
          newEntry: {
            peso,
            altura,
            cintura: medidas.cintura,
            quadril: medidas.quadril,
          },
          name: nome,
          date: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      alert("Erro ao cadastrar cliente. Tente novamente.");
    }
  };

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cadastrar cliente</h1>
          <p className="page-subtitle">
            Os dados e medidas informados aqui viram a primeira avaliação do cliente.
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <span className="material-symbols-rounded">person</span>
            Dados pessoais
          </h2>
          <span className="panel-hint">Nome e plano são obrigatórios</span>
        </div>
        <div className="form-grid">
          <div className="field span-2">
            <label htmlFor="nome">Nome</label>
            <input className="input" type="text" id="nome" />
          </div>
          <div className="field">
            <label htmlFor="idade">Idade</label>
            <input className="input" type="text" id="idade" />
          </div>
          <div className="field">
            <label htmlFor="sexo">Sexo</label>
            <select
              id="sexo"
              name="sexo"
              className="input"
              value={sexo}
              onChange={(e) => setSexo(e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="altura">
              Altura <span className="field-unit">(m)</span>
            </label>
            <input
              className="input"
              type="number"
              id="altura"
              inputMode="decimal"
              step="0.01"
              min="0"
              max="300"
              placeholder="Ex: 1.80 ou 1,80"
              onChange={(e) => {
                // Converte vírgula para ponto em tempo real
                const value = e.target.value.replace(",", ".");
                e.target.value = value;
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="peso">
              Peso <span className="field-unit">(kg)</span>
            </label>
            <input className="input" type="text" id="peso" />
          </div>
          <div className="field span-2">
            <label htmlFor="plano">Plano semanal</label>
            <select
              id="plano"
              name="plano"
              className="input"
              value={plano}
              onChange={(e) => setPlano(e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="3">3 dias por semana</option>
              <option value="5">5 dias por semana</option>
            </select>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <span className="material-symbols-rounded">contact_mail</span>
            Contato e endereço
          </h2>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="telefone">Telefone</label>
            <input
              className="input"
              type="tel"
              id="telefone"
              placeholder="(00) 00000-0000"
              maxLength="15"
              onChange={(e) => {
                const formatted = formatTelefone(e.target.value);
                e.target.value = formatted;
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="cpf">CPF</label>
            <input
              className="input"
              type="text"
              id="cpf"
              placeholder="000.000.000-00"
              maxLength="14"
              onChange={(e) => {
                const formatted = formatCPF(e.target.value);
                e.target.value = formatted;
              }}
            />
          </div>
          <div className="field span-2">
            <label htmlFor="email">Email</label>
            <input className="input" type="email" id="email" placeholder="exemplo@email.com" />
          </div>
          <div className="field span-2">
            <label htmlFor="endereco">Endereço</label>
            <input className="input" type="text" id="endereco" />
          </div>
          <div className="field">
            <label htmlFor="numero">Número</label>
            <input className="input" type="text" id="numero" />
          </div>
          <div className="field">
            <label htmlFor="bairro">Bairro</label>
            <input className="input" type="text" id="bairro" />
          </div>
          <div className="field span-2">
            <label htmlFor="cidade">Cidade</label>
            <input className="input" type="text" id="cidade" />
          </div>
          <div className="field">
            <label htmlFor="estado">Estado</label>
            <input className="input" type="text" id="estado" maxLength="2" placeholder="Ex: SP" />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <span className="material-symbols-rounded">straighten</span>
            Medidas iniciais
          </h2>
          <span className="panel-hint">Valores em centímetros</span>
        </div>
        <div className="form-grid">
          {MEDIDAS_CAMPOS.map(({ key, label }) => {
            const id = toInputId(key);
            return (
              <div className="field" key={key}>
                <label htmlFor={id}>{label}</label>
                <input
                  className="input"
                  type="number"
                  id={id}
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                />
              </div>
            );
          })}
        </div>
      </section>

      <div className="form-footer">
        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary" onClick={handleCadastrar}>
          <span className="material-symbols-rounded">check</span>
          Cadastrar cliente
        </button>
      </div>
    </div>
  );
};

export default Cadastro;
