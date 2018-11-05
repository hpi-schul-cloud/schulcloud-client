importScripts('/scripts/sw/workbox/workbox-sw.js');
importScripts('/vendor-optimized/localforage/dist/localforage.min.js');

workbox.setConfig({
    modulePathPrefix: '/scripts/sw/workbox/'
});
workbox.skipWaiting();
workbox.clientsClaim();

workbox.precaching.precacheAndRoute([]);

self.addEventListener('install', (event) => {
    const urls = ['/calendar/events/'];
    const cacheName = workbox.core.cacheNames.runtime;
    event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(urls)));
});

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
    /\/(dashboard|news)\/$/,
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

// calendar events https://developers.google.com/web/tools/workbox/guides/advanced-recipes
const postMessagePlugin = {
    cacheDidUpdate: async ({ cacheName, url, oldResponse, newResponse }) => {
        if (oldResponse && (oldResponse.headers.get('etag') !== newResponse.headers.get('etag'))) {
            const clients = await self.clients.matchAll();
            for (const client of clients) {
                client.postMessage({
                    "tag": "calendar-event-updates",
                    "url": newResponse.url, 
                    "cacheName": cacheName 
                });
            }
        }
    },
};
workbox.routing.registerRoute(
    '/calendar/events/',
    workbox.strategies.staleWhileRevalidate({
        cacheName: workbox.core.cacheNames.runtime,
        plugins: [
            postMessagePlugin
        ]
    })
);

workbox.routing.registerRoute(
    /vendor-optimized\//,
    workbox.strategies.cacheFirst({
        cacheName: 'vendors',
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

let courseStore = localforage.createInstance({
    name: 'courses'
});
let courseOfflineStore = localforage.createInstance({
    name: 'coursesOffline'
});

function downloadCourse(courseId) {
    const cacheName = 'courses';

    let urls = {};
    fetch(`/courses/${courseId}/offline`)
        .then(response => response.json())
        .then(json => {
            courseOfflineStore.setItem(json.course._id, json); // todo set on success precache only
            urls[json.course.url] = {updatedAt: json.course.updatedAt};
            json.lessons.forEach(lesson => {
                urls[lesson.url] = {updatedAt:lesson.updatedAt};
            });
            return caches.open(cacheName)
                .then((cache) => Object.keys(urls).forEach(function (url) { // todo promise all?
                    return cache.add(url).then(_ => courseStore.setItem(url,urls[url]));
                }));
    });
}

self.addEventListener('message', function(event){
    if(event.data.tag === 'downloadCourse'){
        downloadCourse(event.data.courseId);
    }
});
