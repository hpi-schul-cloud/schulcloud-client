importScripts('/scripts/sw/workbox/workbox-sw.js');

workbox.setConfig({
    modulePathPrefix: '/scripts/sw/workbox/'
  });
workbox.skipWaiting();
workbox.clientsClaim(); 

workbox.precaching.precacheAndRoute([]);

self.addEventListener('fetch', event => {
    event.respondWith(customHeaderRequestFetch(event));
});

function customHeaderRequestFetch(event) {
    return new Promise((resolve, reject) =>{
        if (event.request.url.endsWith('/logs/')){
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
        } else {
            resolve(fetch(event.request));
        }
    });
}
