// importScripts('/scripts/sw/workbox-sw.js');

// workbox.skipWaiting();
// workbox.clientsClaim();

/* workbox.precaching.precacheAndRoute([]); */

self.addEventListener('fetch', event => {
    event.respondWith(customHeaderRequestFetch(event));
});

function customHeaderRequestFetch(event) {
    if (event.request.url.endsWith('/logs/')){
        event.request.blob().then(blob =>{
            const newRequest = new Request(event.request.url, {
                headers: {
                    'sw-enabled': 'enabled'
                },
                method: 'POST',
                body: blob
            });
            return fetch(newRequest);
        });
    } else {
        return fetch(event.request);
    }


}
