importScripts('/scripts/sw/workbox/workbox-sw.js');

workbox.setConfig({
    modulePathPrefix: '/scripts/sw/workbox/'
  });
workbox.skipWaiting();
workbox.clientsClaim(); 

workbox.precaching.precacheAndRoute([]);

// stale while revalidate: school logo images/schools/**/*.*
workbox.routing.registerRoute(
    new RegExp('/images/schools/.*/.*'),
    workbox.strategies.staleWhileRevalidate()
);

self.addEventListener('fetch', event => {
    if (event.request.url.endsWith('/logs/')){
        event.respondWith(customHeaderRequestFetch(event));
    }
});

function customHeaderRequestFetch(event) {
    return new Promise((resolve, reject) =>{
        event.request.blob().then(blob =>{
            const newRequest = new Request(event.request.url, {
                headers: {
                    'sw-enabled': true
                },
                method: 'POST',
                body: blob
            });
            resolve(fetch(newRequest));
        });
    });
}

// https://developers.google.com/web/tools/workbox/modules/workbox-broadcast-cache-update
workbox.routing.registerRoute(
    '/calendar/events/',
    workbox.strategies.staleWhileRevalidate({
        plugins: [
            new workbox.broadcastUpdate.Plugin('event-updates')
        ]
    })
);
