importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v9'
var CACHE_DYNAMIC_NAME = 'dynamic-v9'
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

var url = 'https://pwagram-75ea1.firebaseio.com/posts';

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

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

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(fetch(event.request)
      .then(function (res) {
        var clonedRes = res.clone();
        clearAllData('posts')
          .then(function () {
            return clonedRes.json();
          })
          .then(function (data) {
            for (var key in data) {
              writeData('posts', data[key]);
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

self.addEventListener('sync', function (event) {
  console.log('[SW] Background syncing...', event);
  if (event.tag === 'sync-new-posts') {
    console.log('[SW] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts')
      .then(function (data) {
        for (var dt of data) {
          fetch('https://us-central1-pwagram-75ea1.cloudfunctions.net/storePostData', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image: "https://firebasestorage.googleapis.com/v0/b/pwagram-75ea1.appspot.com/o/docker.jpg?alt=media&token=74df5c75-1a78-447d-a48e-0bdfff5ec1b9"
              })
            })
            .then(function (res) {
              console.log('Sent data', res);
              if (res.ok) {
                res.json()
                  .then(function (resData) {
                    deleteItemFromData('sync-posts', resData.id);
                  })
              }
            })
            .catch(function (error) {
              console.log(error);
            })
        }
      })
    )
  }
})