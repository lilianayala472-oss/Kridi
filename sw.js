/* Offline cache: serves the app from cache, refreshes it in the background when online. */
var CACHE = 'kridi-v2';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){ return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(function(cache){
      return cache.match(req, {ignoreSearch: true}).then(function(hit){
        var fresh = fetch(req).then(function(res){
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(function(){ return hit; });
        return hit || fresh;
      });
    })
  );
});
