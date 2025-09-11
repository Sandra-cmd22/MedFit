import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAInstaller = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registrado: ' + r);
    },
    onRegisterError(error) {
      console.log('Erro ao registrar SW: ', error);
    },
  });

  useEffect(() => {
    // Verificar se o app já está instalado
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Verificar se está em modo standalone no iOS
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        return;
      }
      
      setIsInstalled(false);
    };

    checkInstalled();

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA instalado com sucesso!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou instalar o PWA');
    } else {
      console.log('Usuário rejeitou instalar o PWA');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleUpdateClick = () => {
    setNeedRefresh(false);
    updateServiceWorker(true);
  };

  // Não mostrar nada se já estiver instalado ou se não há prompt
  if (isInstalled) return null;

  return (
    <>
      {/* Banner de instalação */}
      {showInstallPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0C518D',
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 9999,
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
              download
            </span>
            <span>Instale o MedFit para uma melhor experiência</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleInstallClick}
              style={{
                backgroundColor: 'white',
                color: '#0C518D',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Instalar
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                border: '1px solid white',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Agora não
            </button>
          </div>
        </div>
      )}

      {/* Banner de atualização */}
      {needRefresh && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '16px',
          right: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 9998,
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
              update
            </span>
            <span>Nova versão disponível!</span>
          </div>
          <button
            onClick={handleUpdateClick}
            style={{
              backgroundColor: 'white',
              color: '#4CAF50',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Atualizar
          </button>
        </div>
      )}
    </>
  );
};

export default PWAInstaller;
