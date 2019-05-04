var CACHE_STATIC_NAME = 'static-v7'
var CACHE_DYNAMIC_NAME = 'dynamic-v7'
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
]

//Trimming the cache
/* function trimCache(cacheName, maxItems) {
  caches.open(cacheName)
    .then(function (cache) {
      return cache.keys()
    })
    .then(function (keys) {
      if (keys.length > maxItems) {
        cache.delete(keys[0])
          .then(trimCache(cacheName, maxItems));
      }
    })
} */

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
    .then(function (cache) {
      console.log('[Service worker precaching App Shell]')
      return cache.addAll(STATIC_FILES)
        .then(function () {
          return self.skipWaiting();
        })
    })

  )
});

self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
    .then(function (keyList) {
      return Promise.all(keyList.map(function (key) {
        if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
          console.log('Removing old cache', key)
          return caches.delete(key)
        }
      }));
    }));
  return self.clients.claim();
});

// Cache First then network strategy starts
self.addEventListener('fetch', function (event) {
  var url = 'https://httpbin.org/get';

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
      .then(function (cache) {
        return fetch(event.request)
          .then(function (res) {
            /* trimCache(CACHE_DYNAMIC_NAME, 3); */
            cache.put(event.request, res.clone());
            return res;
          });
      })
    )
  } else {
    event.respondWith(
      caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function (res) {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then(function (cache) {
                  /* trimCache(CACHE_DYNAMIC_NAME, 3); */
                  cache.put(event.request.url, res.clone())
                  return res;
                })
            })
            .catch(function (error) {
              return caches.open(CACHE_STATIC_NAME)
                .then(function (cache) {
                  if (event.request.url.headers.get('accept').includes('text/html')) {
                    return cache.match('/offline.html');
                  }
                })
            });
        }
      })
    );
  }
});

// Cache First then network strategy ends

/* self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request)
                        .then(function (res) {
                            return caches.open(CACHE_DYNAMIC_NAME)
                                .then(function (cache) {
                                    cache.put(event.request.url, res.clone())
                                    return res;
                                })
                        })
                        .catch(function (error) {
                            return caches.open(CACHE_STATIC_NAME)
                                .then(function (cache) {
                                    return cache.match('/offline.html');
                                })
                        });
                }
            })
    );
}); */