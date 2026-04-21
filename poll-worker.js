// poll-worker.js
// Web Worker que ejecuta el polling a Supabase en hilo separado
// iOS Safari no congela los Web Workers igual que el hilo principal

var pollInterval = null;
var config = null;

self.onmessage = function(e) {
  var msg = e.data;

  if (msg.type === 'start') {
    config = msg;
    // Consulta inmediata
    consultar();
    // Polling cada 5 segundos
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(consultar, 5000);
  }

  if (msg.type === 'stop') {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = null;
  }
};

function consultar() {
  if (!config) return;
  var url = config.supabaseUrl + '/rest/v1/despachos?id=eq.' + config.despachoId
    + '&select=circuito,mensaje_mostrador&limit=1';

  fetch(url, {
    method: 'GET',
    headers: {
      'apikey': config.anonKey,
      'Authorization': 'Bearer ' + config.anonKey,
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache'
    }
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data && data[0]) {
      self.postMessage({ type: 'data', data: data[0] });
    } else {
      self.postMessage({ type: 'error' });
    }
  })
  .catch(function() {
    self.postMessage({ type: 'error' });
  });
}
