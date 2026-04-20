// conductor-sw.js
// Service Worker del conductor - gestiona push notifications

const CACHE = 'conductor-v1';
const ARCHIVOS = ['/conductor.html'];

// Instalación
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ARCHIVOS).catch(function() {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
});

// Fetch - servir desde caché si disponible
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        var clone = res.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return res;
      })
      .catch(function() { return caches.match(e.request); })
  );
});

// PUSH NOTIFICATION - se dispara aunque la app esté cerrada
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) {}

  var iconos = {
    'verde':   '✅',
    'naranja': '⏳',
    'rojo':    '🔴',
  };

  var tipo = (data.circuito || '').startsWith('rojo') ? 'rojo' : (data.circuito || 'verde');
  var icono = iconos[tipo] || '🚛';

  var titulo = icono + ' ' + (data.matricula || 'Despacho');
  var cuerpo = data.mensaje || 'Estado actualizado';

  var opciones = {
    body:             cuerpo,
    icon:             '/icon-192.png',
    badge:            '/icon-192.png',
    tag:              'despacho-' + (data.despacho_id || ''),
    requireInteraction: true,   // No desaparece sola hasta que el usuario la toca
    vibrate:          [200, 100, 200],
    data:             { url: '/conductor.html' },
  };

  e.waitUntil(
    self.registration.showNotification(titulo, opciones)
  );
});

// Al tocar la notificación - abrir o enfocar la app
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clients) {
        for (var i = 0; i < clients.length; i++) {
          if (clients[i].url.includes('conductor') && 'focus' in clients[i]) {
            return clients[i].focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/conductor.html');
        }
      })
  );
});
