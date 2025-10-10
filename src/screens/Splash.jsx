import React from "react";
import { useNavigate } from "react-router-dom";
import splashImg from "../assets/imagem.png";

const Splash = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0C518D',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0px',
      fontFamily: 'Poppins, sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span style={{
          fontFamily: 'Racing Sans One, cursive',
          fontSize: '42px',
          color: 'white',
          fontWeight: 'bold'
        }}>MedFit</span>
      </div>
      <img src={splashImg} alt="MedFit" style={{
        objectFit: 'contain',
        marginBottom: '0px',
        maxWidth: '100%',
        height: 'auto'
      }} />
      <div style={{
        backgroundColor: 'white',
        borderTopLeftRadius: '42px',
        borderTopRightRadius: '42px',
        borderBottomLeftRadius: '0px',
        borderBottomRightRadius: '0px',
        padding: '32px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        width: '390px',
        maxWidth: '100%'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'left',
          marginBottom: '16px',
          fontFamily: 'Racing Sans One, cursive'
        }}>
          Pronto para começar sua jornada?
        </h2>
        <p style={{
          color: '#6b7280',
          textAlign: 'left',
          marginBottom: '32px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Seu progresso, registrado de forma simples.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button 
            style={{
              width: '100%',
              backgroundColor: '#0C518D',
              color: 'white',
              borderRadius: '8px',
              height: '48px',
              padding: '0 16px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              border: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0a3f73'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0C518D'}
            onClick={() => navigate("/cadastro")}
          >
            Cadastrar Cliente
          </button>
          <button
            style={{
              width: '100%',
              backgroundColor: 'white',
              color: '#0C518D',
              borderRadius: '8px',
              height: '48px',
              padding: '0 16px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              border: '2px solid #0C518D',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
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
