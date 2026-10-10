import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAInstaller = () => {
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

  const handleUpdateClick = () => {
    setNeedRefresh(false);
    updateServiceWorker(true);
  };

  if (!needRefresh) return null;

  return (
    <div className="pwa-update-banner">
      <span>Nova versão disponível!</span>
      <button type="button" className="btn btn-primary" onClick={handleUpdateClick}>
        Atualizar
      </button>
    </div>
  );
};

export default PWAInstaller;
