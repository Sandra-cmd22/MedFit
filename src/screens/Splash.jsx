import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Splash.css";
import splashImg from "../assets/imagem.png";
import logoAdrenalina from "../assets/LOGO.ADRENALINA.svg";

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
    <div className="splash-container">
      <div className="splash-logo">
        <img src={logoAdrenalina} alt="Adrenalina" className="logo-img" />
      </div>
      <img src={splashImg} alt="MedFit" className="splash-img" />

      <div className="splash-card">
        <h2 className="splash-title">Bem-vinda(o)!</h2>
        <p className="splash-subtitle">
          Digite a senha de acesso para abrir o painel seguro.
        </p>

        <form className="splash-form" onSubmit={handleSubmit}>
          <label className="splash-label" htmlFor="password">
            Senha
          </label>
          <div className="splash-input-wrapper">
            <span
              className="material-symbols-rounded splash-icon"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              lock
            </span>
            <input
              id="password"
              type="password"
              className="splash-input"
              placeholder="Digite a senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="splash-error">{error}</p>}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Splash;
