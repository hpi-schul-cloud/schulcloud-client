import { pushManager } from './scripts/notificationService/index';
import messagingSW from './scripts/message/message-sw';
import { notificationHandler } from './scripts/notificationService/notificationHandler';

importScripts('/vendor-optimized/firebase/firebase-app.js');
importScripts('/vendor-optimized/firebase/firebase-messaging.js');


// self.addEventListener('message', (event) => {
// 	// FIXME update PM to handle message
// 	event.waitUntil(pushManager.handleNotification(self.registration, event));
// });

self.addEventListener('push', (event) => {
	const data = event.data.json();
	event.waitUntil(notificationHandler.handle(self.registration, data));
});


importScripts('/scripts/sw/workbox/workbox-sw.js');

workbox.setConfig({
	modulePathPrefix: '/scripts/sw/workbox/',
	debug: false,
});
workbox.skipWaiting();
workbox.clientsClaim();

workbox.precaching.precacheAndRoute([]);

self.addEventListener('install', (event) => {
	const urls = ['/calendar/events/'];
	const cacheName = workbox.core.cacheNames.runtime;
	event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(urls)));
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
	workbox.strategies.staleWhileRevalidate(),
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
	}),
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
	}),
);

const queue = new workbox.backgroundSync.Queue('logs');

function customHeaderRequestFetch(event) {
	let newRequest;
	return event.request.blob().then((blob) => {
		newRequest = new Request(event.request.url, {
			headers: {
				'sw-enabled': true,
			},
			method: 'POST',
			body: blob,
		});
		return fetch(newRequest.clone());
	}).catch(_ => newRequest.blob().then(blob => new Request(event.request.url, {
		headers: {
			'sw-enabled': true,
			'sw-offline': true,
		},
		method: 'POST',
		body: blob,
	})).then((req) => {
		queue.addRequest(req);
		return new Response('cached');
	})).catch((err) => {
		console.log(err);
	});
}

self.addEventListener('fetch', (event) => {
	if (event.request.url.endsWith('/logs/')) {
		event.respondWith(customHeaderRequestFetch(event));
	}
});

// calendar events https://developers.google.com/web/tools/workbox/guides/advanced-recipes
const postMessagePlugin = {
	cacheDidUpdate: async ({
		cacheName, url, oldResponse, newResponse,
	}) => {
		if (oldResponse && (oldResponse.headers.get('etag') !== newResponse.headers.get('etag'))) {
			const clients = await self.clients.matchAll();
			for (const client of clients) {
				client.postMessage({
					tag: 'calendar-event-updates',
					url: newResponse.url,
					cacheName,
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
			postMessagePlugin,
		],
	}),
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
	}),
);


self.addEventListener('message', (event) => {
	if (event.data.tag === 'course-data-updated') {
		event.waitUntil(pushManager.handleNotification(self.registration, event));
	}
});

// self.addEventListener('push', function(event){
//     const data = event.data.json();
//     console.log('push sw', data);
//     event.waitUntil(pushManager.handleNotification(self.registration, data));
// });


const courseRoutes = [
	/\/courses\/[a-f0-9]{24}\/topics\/[a-f0-9]{24}\/$/,
	/\/courses\/[a-f0-9]{24}$/,
];
courseRoutes.forEach((route) => {
	workbox.routing.registerRoute(
		route,
		workbox.strategies.cacheFirst({
			cacheName: 'courses',
		}),
	);
});

// todo move to downloader
function getNextCourses() {
	return fetch('/courses/offline').then(response => response.json()).then((data) => {
		if (data.courses && data.courses.length) {
			return Promise.all(data.courses.map((course) => {
				courseDownloader.downloadCourse(course._id);
			}));
		}
		return Promise.resolve();
	}).catch(err => console.log(err));
}
