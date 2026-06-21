var CACHE = 'lm-v13';
var SHELL = [
  './life-managerV11.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      // addAll 失敗（例如 CDN 離線）也不阻斷安裝
      return c.add('./life-managerV11.html').catch(function(){});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // Supabase API：永遠走網路，不快取
  if(url.hostname.endsWith('.supabase.co')) return;

  // CDN（supabase-js）：網路優先，離線時從快取回傳
  if(url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(
      fetch(e.request).then(function(r) {
        var clone = r.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return r;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // App shell：網路優先，有網路時一定拿最新版；離線時才用快取
  e.respondWith(
    fetch(e.request).then(function(r) {
      if(r && r.status === 200) {
        var clone = r.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      }
      return r;
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('./life-managerV11.html');
      });
    })
  );
});
