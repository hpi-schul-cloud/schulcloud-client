importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

// Note: Ignore the error that Glitch raises about workbox being undefined.
workbox.skipWaiting();
workbox.clientsClaim();

// caching of images
workbox.routing.registerRoute(
/\.(?:png|gif|jpg|jpeg|svg)$/,
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

const cacheFirstRoutes = [
    'https://cdn.mathjax.org/mathjax/contrib/a11y/accessibility-menu.js?V=2.7.0',
    'https://cdn.mathjax.org/mathjax/contrib/a11y/accessibility-menu.js?V=2.7.0',
    'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js?config=TeX-AMS_HTML',
    'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/config/TeX-AMS_HTML.js?V=2.7.0',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Brandenburg_Wappen.svg/354px-Brandenburg_Wappen.svg.png',
    'https://unpkg.com/@feathersjs/client@3.5.1/dist/feathers.js',
    'https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js',
    'https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js',
    'https://media.giphy.com/media/3oz8xBkRsgPTnbK1GM/giphy.gif',
    'https://open.hpi.de/piwik/piwik.js',
    'https://unpkg.com/socket.io-client@1.7.3/dist/socket.io.js',
  ];
  
cacheFirstRoutes.forEach(route => {
    workbox.routing.registerRoute(
        route,
        workbox.strategies.cacheFirst({
          plugins: [
            new workbox.cacheableResponse.Plugin({
              statuses: [0, 200]
            })
          ]
      })
    );
});

workbox.routing.registerRoute(
    '/calendar/',
    workbox.strategies.staleWhileRevalidate({
        cacheName: workbox.core.cacheNames.precache
        })
);

workbox.routing.registerRoute(
    '/dashboard/',
    workbox.strategies.staleWhileRevalidate(  {
        cacheName: workbox.core.cacheNames.precache
    })
);

workbox.routing.registerRoute(
    '/news/',
    workbox.strategies.networkFirst(  {
        cacheName: workbox.core.cacheNames.precache
    })
);

// https://developers.google.com/web/tools/workbox/modules/workbox-broadcast-cache-update
workbox.routing.registerRoute(
    '/calendar/events/',
    workbox.strategies.staleWhileRevalidate({
        plugins: [
            new workbox.broadcastUpdate.Plugin('event-updates')
        ]
    })
);


workbox.precaching.precacheAndRoute([]);

// https://developers.google.com/web/tools/workbox/modules/workbox-precaching
