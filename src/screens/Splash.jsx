import React from "react";
import { useNavigate } from "react-router-dom";
import "./Splash.css";
import splashImg from "../assets/imagem.png"; // Corrigido o nome do arquivo

const Splash = () => {
  const navigate = useNavigate();

  return (
    <div className="splash-container">
      <div className="splash-logo">
        <span className="logo-text">MedFit</span>
      </div>
      <img src={splashImg} alt="MedFit" className="splash-img" />{" "}
      {/* Corrigida a classe */}
      <div className="splash-card">
        <h2 className="splash-title">Pronto para começar sua jornada?</h2>
        <p className="splash-subtitle">
          Seu progresso, registrado de forma simples.
        </p>
        <div className="splash-buttons">
          <button className="primary-btn" onClick={() => navigate("/cadastro")}>
            Cadastrar Cliente
          </button>
          <button
            className="secondary-btn"
            onClick={() => navigate("/clientes")}
          >
            Ver Cliente
          </button>
        </div>
      </div>
    </div>
  );
};

export default Splash;
