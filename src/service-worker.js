if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Ativação do service worker
});

self.addEventListener('fetch', event => {
  // Pode adicionar lógica de cache aqui
});