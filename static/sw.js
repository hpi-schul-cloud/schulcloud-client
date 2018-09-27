importScripts('/scripts/sw/workbox/workbox-sw.js');

workbox.setConfig({
    modulePathPrefix: '/scripts/sw/workbox/'
  });
workbox.skipWaiting();
workbox.clientsClaim(); 

workbox.precaching.precacheAndRoute([]);

// cache images
workbox.routing.registerRoute(
    /\.(?:png|PNG|gif|GIF|jpg|JPG|jpeg|JPEG|svg|SVG)$/,
    workbox.strategies.cacheFirst({
        cacheName: 'images',
        plugins: [
        new workbox.expiration.Plugin({
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
        ],
    }),
);

// cache pages for one hour
workbox.routing.registerRoute(
    /\/(dashboard|news|courses)\/$/,
    workbox.strategies.networkFirst({
        cacheName: 'pages',
        maxAgeSeconds: 60 * 60,
        networkTimeoutSeconds: 3,
        plugins: [
            new workbox.expiration.Plugin({
              maxEntries: 50,
              maxAgeSeconds: 60 * 60, 
            }),
            new workbox.cacheableResponse.Plugin({
              statuses: [0, 200],
            }),
          ],
    })
);

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

self.addEventListener('fetch', event => {
    if (event.request.url.endsWith('/logs/')){
        event.respondWith(customHeaderRequestFetch(event));
    }
});

// calendar events
// https://developers.google.com/web/tools/workbox/modules/workbox-broadcast-cache-update
workbox.routing.registerRoute(
    '/calendar/events/',
    workbox.strategies.staleWhileRevalidate({
        plugins: [
            new workbox.broadcastUpdate.Plugin('event-updates')
        ]
    })
);
