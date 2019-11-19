/* eslint-disable no-console */

// this file contains cleanup tasks which may be outdated at some time

window.addEventListener('load', () => {
	if ('serviceWorker' in navigator) {
		try {
			navigator.serviceWorker.getRegistrations().then(
				(registrations) => {
					for (const registration of registrations) {
						registration.unregister();
					}
				},
			);
		} catch (err) { console.error(err); }
	}
	if ('caches' in window) {
		try {
			caches.keys().then(cacheNames => Promise.all(
				cacheNames.filter(cacheName => caches.delete(cacheName)),
			));
		} catch (err) { console.error(err); }
	}
});
