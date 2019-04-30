/* Registering the service worker if it's available  */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(function () {
            console.log('Service woker registered');
        })
}