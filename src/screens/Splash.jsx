import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Splash.css";
import backgroundImg from "../assets/img.jpg";
import logoRed from "../assets/logo.red.svg";

const PASSWORD = "adelina";

const Splash = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyLogged = localStorage.getItem("medfit_auth") === "true";
    if (alreadyLogged) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const normalized = (password || "").trim();
      if (normalized !== PASSWORD) {
        setError("Senha incorreta. Tente novamente.");
        return;
      }
      localStorage.setItem("medfit_auth", "true");
      navigate("/home", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section
        className="login-hero"
        style={{ backgroundImage: `url(${backgroundImg})` }}
      >
        <div className="login-hero-overlay" />
        <div className="login-hero-content">
          <div className="login-brand">
            <img src={logoRed} alt="" className="login-brand-logo" />
            <span>MedFit</span>
          </div>
          <div>
            <h1 className="login-hero-title">Avaliação física e acompanhamento de clientes</h1>
            <p className="login-hero-text">
              Cadastre clientes, registre medidas e acompanhe a evolução de IMC e RCQ em um só lugar.
            </p>
          </div>
        </div>
      </section>

      <section className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title">Entrar</h2>
          <p className="login-subtitle">
            Digite a senha de acesso para abrir o painel.
          </p>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className="input login-input"
              placeholder="Digite a senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </div>
          {error && <p className="login-error">{error}</p>}

          <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Splash;
