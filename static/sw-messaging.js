import { pushManager } from './scripts/notificationService/index';
import messagingSW from './scripts/message/message-sw';

importScripts('/vendor-optimized/firebase/firebase-app.js');
importScripts('/vendor-optimized/firebase/firebase-messaging.js');


async function setupFirebaseMessaging() {
	const firebaseOptions = await pushManager.getOptions('firebaseOptions');
	messagingSW.setupMessaging();
	firebase.initializeApp(firebaseOptions);

	// Retrieve an instance of Firebase Messaging so that it can handle background
	// messages.
	const messaging = firebase.messaging();

	messaging.setBackgroundMessageHandler(
		payload => pushManager.handleNotification(self.registration, payload, 'background'),
	);
}

setupFirebaseMessaging();

// self.addEventListener('message', (event) => {
// 	// FIXME update PM to handle message
// 	event.waitUntil(pushManager.handleNotification(self.registration, event));
// });

// self.addEventListener('push', function(event){
//     const data = event.data.json();
//     console.log('push sw', data);
//     event.waitUntil(pushManager.handleNotification(self.registration, data));
// });
