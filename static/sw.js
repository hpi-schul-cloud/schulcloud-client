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
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Brandenburg_Wappen.svg/354px-Brandenburg_Wappen.svg.png',
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
    '/calendar/events',
    workbox.strategies.staleWhileRevalidate({
        plugins: [
            new workbox.broadcastUpdate.Plugin('event-updates')
        ]
    })
);


workbox.precaching.precacheAndRoute([]);
