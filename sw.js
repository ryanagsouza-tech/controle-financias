// Service worker: guarda uma cópia dos arquivos do app para ele abrir sem internet.
// Estratégia "rede primeiro": com sinal, sempre busca a versão nova; sem sinal, usa a cópia guardada.
// Só mexa em VERSAO se quiser forçar a limpeza do cache antigo.
const VERSAO = 'cf-4.0.0';
const ARQUIVOS = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/main.js', 'js/constantes.js', 'js/util.js', 'js/dados.js', 'js/calculos.js', 'js/armazenamento.js',
  'js/tema.js', 'js/ui.js', 'js/views.js', 'js/render.js', 'js/acoes.js', 'js/eventos.js', 'js/mapa.js', 'js/estado.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        const copia = res.clone();
        caches.open(VERSAO).then(c => c.put(req, copia));
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
