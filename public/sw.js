self.addEventListener('install', function (event) {
    console.log('[Service woker] installed...', event);
})

self.addEventListener('activated', function (event) {
    console.log('[Service woker] activating service worker...', event);
    return self.clients.claim();
})

self.addEventListener('fetch', function (event) {
    console.log('[Service woker] fetching something...', event);
    event.respondWith(fetch(event.request))
})