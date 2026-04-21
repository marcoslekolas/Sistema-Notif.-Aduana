// conductor-sw.js
// Service Worker MINIMO - solo push, NO cachea nada

self.addEventListener('install', function(e) { self.skipWaiting(); });

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

// NO interceptar fetch - dejar pasar todo directamente al servidor
// Esto es lo que permite que el polling a Supabase funcione en iOS PWA

self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) {}
  var iconos = { 'verde':'✅', 'naranja':'⏳', 'rojo':'🔴' };
  var tipo = (data.circuito||'').startsWith('rojo') ? 'rojo' : (data.circuito||'verde');
  e.waitUntil(
    self.registration.showNotification(
      iconos[tipo] + ' ' + (data.matricula||'Despacho'), {
        body: data.mensaje || 'Estado actualizado',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'despacho-' + (data.despacho_id||''),
        requireInteraction: true,
        vibrate: [200,100,200],
        data: { url: '/conductor.html' }
      }
    )
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(clients) {
      for (var i=0; i<clients.length; i++) {
        if (clients[i].url.includes('conductor') && 'focus' in clients[i]) return clients[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/conductor.html');
    })
  );
});
