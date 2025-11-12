import { ptBR } from "date-fns/locale";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase.config.js";
import BottomNav from "../components/BottomNav.jsx";
import "./Cadastro.css";
registerLocale("pt-BR", ptBR);

const Cadastro = () => {
  const navigate = useNavigate();
  const [sexo, setSexo] = useState("");
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

      if (!nome) {
        alert("Nome é obrigatório");
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
        medidas,
        dataCadastro: new Date().toISOString(),
      };

      // Salvar no Firestore
      await addDoc(collection(db, "clientes"), cliente);

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
    <div className="container">
      <div className="scroll-view">
        <div className="header">
          <a href="#" className="back-button" onClick={() => navigate(-1)}>
            <span
              className="material-symbols-rounded"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              arrow_back
            </span>
          </a>
          <h1 className="header-text">Cadastro</h1>
          <div className="placeholder" />
        </div>

        <div className="form-content">
          <div className="col full-width">
            <label className="label" htmlFor="nome">
              Nome
            </label>
            <input className="input" type="text" id="nome" />
          </div>

          <div className="row">
            <div className="col">
              <label className="label" htmlFor="idade">
                Idade
              </label>
              <input className="input" type="text" id="idade" />
            </div>
            <div className="col">
              <label className="label" htmlFor="altura">
                Altura (cm)
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
          </div>

          <div className="row">
            <div className="col">
              <label className="label" htmlFor="sexo">
                Sexo
              </label>
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
            <div className="col">
              <label className="label" htmlFor="peso">
                Peso
              </label>
              <input className="input" type="text" id="peso" />
            </div>
          </div>

          <span className="section-title medidas-title">Medidas</span>

          <div className="row">
            <div className="col">
              <label className="label" htmlFor="braco-direito">
                Braço <span className="paren">(direito)</span>
              </label>
              <input
                className="input"
                type="number"
                id="braco-direito"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
            <div className="col">
              <label className="label" htmlFor="braco-esquerdo">
                Braço <span className="paren">(esquerdo)</span>
              </label>
              <input
                className="input"
                type="number"
                id="braco-esquerdo"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label className="label" htmlFor="braco-forca-direito">
                Braço <span className="paren">(força)</span>{" "}
                <span className="paren">(direito)</span>
              </label>
              <input
                className="input"
                type="number"
                id="braco-forca-direito"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
            <div className="col">
              <label className="label" htmlFor="braco-forca-esquerdo">
                Braço <span className="paren">(força)</span>{" "}
                <span className="paren">(esquerdo)</span>
              </label>
              <input
                className="input"
                type="number"
                id="braco-forca-esquerdo"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label className="label" htmlFor="antebraco-direito">
                Antebraço <span className="paren">(direito)</span>
              </label>
              <input
                className="input"
                type="number"
                id="antebraco-direito"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
            <div className="col">
              <label className="label" htmlFor="antebraco-esquerdo">
                Antebraço <span className="paren">(esquerdo)</span>
              </label>
              <input
                className="input"
                type="number"
                id="antebraco-esquerdo"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label className="label" htmlFor="coxa-proximal-direita">
                Coxa <span className="paren">(proximal) (direita)</span>
              </label>
              <input
                className="input"
                type="number"
                id="coxa-proximal-direita"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
            <div className="col">
              <label className="label" htmlFor="coxa-proximal-esquerda">
                Coxa <span className="paren">(proximal) (esquerda)</span>
              </label>
              <input
                className="input"
                type="number"
                id="coxa-proximal-esquerda"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label className="label" htmlFor="coxa-distal-direita">
                Coxa <span className="paren">(distal) (direita)</span>
              </label>
              <input
                className="input"
                type="number"
                id="coxa-distal-direita"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
            <div className="col">
              <label className="label" htmlFor="coxa-distal-esquerda">
                Coxa <span className="paren">(distal) (esquerda)</span>
              </label>
              <input
                className="input"
                type="number"
                id="coxa-distal-esquerda"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label className="label" htmlFor="panturrilha-direita">
                Panturrilha <span className="paren">(direita)</span>
              </label>
              <input
                className="input"
                type="number"
                id="panturrilha-direita"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
            <div className="col">
              <label className="label" htmlFor="panturrilha-esquerda">
                Panturrilha <span className="paren">(esquerda)</span>
              </label>
              <input
                className="input"
                type="number"
                id="panturrilha-esquerda"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label className="label" htmlFor="torax">
                Tórax
              </label>
              <input
                className="input"
                type="number"
                id="torax"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
            <div className="col">
              <label className="label" htmlFor="abdomen">
                Abdômen
              </label>
              <input
                className="input"
                type="number"
                id="abdomen"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label className="label" htmlFor="cintura">
                Cintura
              </label>
              <input
                className="input"
                type="number"
                id="cintura"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
            <div className="col">
              <label className="label" htmlFor="quadril">
                Quadril
              </label>
              <input
                className="input"
                type="number"
                id="quadril"
                inputMode="decimal"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <button type="button" className="button" onClick={handleCadastrar}>
            <span className="button-text">Cadastrar</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Cadastro;
