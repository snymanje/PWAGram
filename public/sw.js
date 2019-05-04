importScripts('/src/js/idb.js');

var CACHE_STATIC_NAME = 'static-v8'
var CACHE_DYNAMIC_NAME = 'dynamic-v8'
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

var dbPromise = idb.open('posts-store', 1, function (db) {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {
      keyPath: 'id'
    });
  }
});

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

  var url = 'https://pwagram-75ea1.firebaseio.com/posts';
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(fetch(event.request)
      .then(function (res) {
        var clonedRes = res.clone();
        clonedRes.json()
          .then(function (data) {
            console.log(data)
            for (var key in data) {
              dbPromise
                .then(function (db) {
                  var tx = db.transaction('posts', 'readwrite');
                  var store = tx.objectStore('posts');
                  store.put(data[key]);
                  return tx.complete;
                });
            }
          });
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(
      caches.match(event.request)
    );
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
                  // trimCache(CACHE_DYNAMIC_NAME, 3);
                  cache.put(event.request.url, res.clone());
                  return res;
                })
            })
            .catch(function (err) {
              return caches.open(CACHE_STATIC_NAME)
                .then(function (cache) {
                  if (event.request.headers.get('accept').includes('text/html')) {
                    return cache.match('/offline.html');
                  }
                });
            });
        }
      })
    );
  }
});

/* self.addEventListener('fetch', function (event) {
  var url = 'https://pwagram-75ea1.firebaseio.com/posts.json';

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(fetch(event.request)
      .then(function (res) {
        var clonedRes = res.clone();
        clonedRes.json()
          .then(function (data) {
            for (var key in data) {
              dbPromise
                .then(function (db) {
                  var tx = db.transaction('posts', 'readwrite');
                  var store = tx.objectStore('posts');
                  store.put(data[key]);
                  return tx.complete;
                });
            }
          });
        return res;
      })
    );
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
                   trimCache(CACHE_DYNAMIC_NAME, 3); 
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
}); */

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