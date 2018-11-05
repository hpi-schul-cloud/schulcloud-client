importScripts('/scripts/sw/workbox/workbox-sw.js');
importScripts('https://unpkg.com/dexie@2.0.4/dist/dexie.js');

workbox.setConfig({
    modulePathPrefix: '/scripts/sw/workbox/'
});
workbox.skipWaiting();
workbox.clientsClaim();

workbox.precaching.precacheAndRoute([]);

workbox.precaching.precacheAndRoute([
    '/calendar/events/'
]);

// cache images
workbox.routing.registerRoute(
    /\.(?:png|PNG|gif|GIF|jpg|JPG|jpeg|JPEG|svg|SVG)$/,
    workbox.strategies.cacheFirst({
        cacheName: 'images',
        plugins: [
            new workbox.cacheableResponse.Plugin({
                statuses: [0, 200],
            }),
            new workbox.expiration.Plugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
            }),
        ],
    }),
);

// cache giphy
workbox.routing.registerRoute(
    'https://media.giphy.com/media/3oz8xBkRsgPTnbK1GM/giphy.gif',
    workbox.strategies.staleWhileRevalidate()
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

workbox.routing.registerRoute(
    /\/news\/[a-f0-9]{24}$/,
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

const queue = new workbox.backgroundSync.Queue('logs');

function customHeaderRequestFetch(event) {
    let newRequest;
    return event.request.blob().then(blob => {
        newRequest = new Request(event.request.url, {
            headers: {
                'sw-enabled': true
            },
            method: 'POST',
            body: blob
        });
        return fetch(newRequest.clone());
    }).catch(_ => {
        return newRequest.blob().then(blob => {
            return new Request(event.request.url, {
                headers: {
                    'sw-enabled': true,
                    'sw-offline': true
                },
                method: 'POST',
                body: blob
            });
        }).then(req => {
            queue.addRequest(req);
            return new Response('cached');
        });
    }).catch(err => {
        console.log(err);
    });
}

self.addEventListener('fetch', event => {
    if (event.request.url.endsWith('/logs/')) {
        event.respondWith(customHeaderRequestFetch(event));
    }
});

// calendar events
// https://developers.google.com/web/tools/workbox/modules/workbox-broadcast-cache-update
workbox.routing.registerRoute(
    '/calendar/events/',
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'workbox-precache',
        plugins: [
            new workbox.broadcastUpdate.Plugin('calendar-event-updates')
        ]
    })
);

self.db = new Dexie("courses");
self.db.version(1).stores({
    pages: 'url,updatedAt'
});

function downloadCourse(courseId) {
    const cacheName = 'courses';

    let urls = {};
    fetch(`/courses/${courseId}/offline`)
        .then(response => response.json())
        .then(json => {
            urls[json.course.url] = json.course.updatedAt;
            json.lessons.forEach(lesson => {
                urls[lesson.url] = lesson.updatedAt;
            });
            return caches.open(cacheName)
                .then((cache) => Promise.all(Object.keys(urls)
                    .forEach(function (url, updatedAt) {
                        cache.add(url)
                            .then(_ => {
                                return self.db.open().then(_=>{
                                    return self.db.courses.add({ url: url, updatedAt: updatedAt });
                                });
                            });
                    })));
        });
}

self.addEventListener('message', function(event){
    if(event.data.tag === 'downloadCourse'){
        downloadCourse(event.data.courseId);
    }
});

const courseRoutes = [
    /\/courses\/$/,
    /\/courses\/[a-f0-9]{24}\/?$/,
    /\/courses\/[a-f0-9]{24}\/topics\/[a-f0-9]{24}\/?$/
];
courseRoutes.forEach(route => {
    workbox.routing.registerRoute(
        route,
        workbox.strategies.cacheFirst({
            cacheName: 'courses',
        })
    );
});
