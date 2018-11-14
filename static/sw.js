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

function addToCache(data) {
    const cacheName = 'courses';
    return caches.open(cacheName)
        .then(cache => cache.add(data.url))
        .then(_ => courseStore.setItem(data.url, data))
        .then(_ => Promise.resolve(data))
        .catch(err => console.log(err));
}

function downloadCourse(courseId) {

    let urls = {};

    function testInCache(data) {
        return caches.open('courses')
            .then(cache => cache.match(data.url))
            .then(response => {
                data.inCache = response !== undefined;
                Promise.resolve(response ? true : false);
            });
    }

    let currentVal, newVal;
    courseOfflineStore.getItem(courseId).then(value => {

        // cleanup existing data

        // step over, if course never seen before
        if (value === null) return;
        let promiseChain = [];
        // test course in cache as expected, otherwise remove
        if (value.course) {
            promiseChain.push(testInCache(value.course));
        }
        // test lessons in cache as expected, otherwise remove
        if (value.lessons && value.lessons.length !== 0) {
            value.lessons.forEach(lesson => {
                promiseChain.push(testInCache(lesson));
            }
            );
        }
        // remove data from course if no more in cache
        return Promise.all(promiseChain).then(_ => {
            if (value.course && value.course.inCache === false) {
                delete value.course;
            }
            if (value.lessons && value.lessons.length !== 0) {
                value.lessons = value.lessons.filter(lesson => lesson.inCache);
            }
            return Promise.resolve(value);
        });
    }).then(value => {

        // fetch course data, if something already cached,
        // request diff and convert to json

        currentVal = value || {};
        return fetch(`/courses/${courseId}/offline`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentVal)
        }).then(response => response.json());
    })
        .then(json => {

            // remove data which has been removed on server side

            if (json.cleanup && json.cleanup.lessons) {
                let lessonsToRemove = currentVal.lessons.filter(lesson => json.cleanup.lessons.includes(lesson._id));
                if (lessonsToRemove) {
                    // remove data from cache
                    return Promise.all(lessonsToRemove.map(lesson => {
                        return caches.open('courses')
                            .then(cache => cache.delete(lesson.url))
                            .then(success => {
                                // handle success?
                                Promise.resolve(success);
                            });
                    })).then(_ => {
                        // cleanup dataset
                        currentVal.lessons = currentVal.lessons.filter(lesson => !json.cleanup.lessons.includes(lesson._id));
                        if (currentVal.cleanup) delete currentVal.cleanup;
                        return json;
                    });
                }
            }
            return json;

        })
        .then(json => {
            // dataset contains content for adding to cache, download data
            newVal = json;
            let urls = [];
            if (json.course) {
                urls.push(addToCache(json.course));
            }
            if (json.lessons && json.lessons.length !== 0) {
                json.lessons.map(lesson => urls.push(addToCache(lesson)));
            }
            return Promise.all(urls);
        }).then(_ => {
            // add downloaded dataset to already existing one
            let updatedValue = {};
            updatedValue.course = newVal.course || currentVal.course;
            updatedValue.lessons = currentVal.lessons || [];
            if (newVal.lessons) {
                newVal.lessons.forEach(lesson => {
                    let oldLesson = updatedValue.lessons.find(l => l._id === lesson._id);
                    if (oldLesson) {
                        Object.assign(oldLesson, lesson);
                    } else {
                        updatedValue.lessons.push(lesson);
                    }
                });
            }
            return courseOfflineStore.setItem(courseId, updatedValue)
                .then(_ => { console.log('updated', courseId); });

        }).catch(err => console.log(err));
}

self.addEventListener('message', function(event){
    if(event.data.tag === 'downloadCourse'){
        downloadCourse(event.data.courseId);
    }
});


let courseRoutes = [
    /\/courses\/[a-f0-9]{24}\/topics\/[a-f0-9]{24}\/$/,
    /\/courses\/[a-f0-9]{24}$/
];
courseRoutes.forEach(route=>{
    workbox.routing.registerRoute(
        route,
        workbox.strategies.cacheFirst({
            cacheName: 'courses'
        })
    );
});


function getNextCourses(){
    return fetch('/courses/offline').then(response => {
        return response.json();
    }).then(data => {
        if(data.courses && data.courses.length){
            return Promise.all(data.courses.map(course =>{
                downloadCourse(course._id);
            }));
        }else{
            return Promise.resolve();
        }
    }).catch(err => console.log(err));
}
