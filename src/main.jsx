import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// Importe todas as suas telas
import Splash from './screens/Splash.jsx';
import Cadastro from './screens/Cadastro.jsx';
import Home from './screens/Home.jsx';
import Clientes from './screens/Clientes.jsx';
import Avaliacao from './screens/Avaliacao.jsx';
import Configuracao from './screens/Configuracao.jsx';
import Historico from './screens/Historico.jsx';

// PWA
import PWAInstaller from './components/PWAInstaller.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PWAInstaller />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/home" element={<Home />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/avaliacao" element={<Avaliacao />} />
        <Route path="/config" element={<Configuracao />} />
        <Route path="/historico" element={<Historico />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);