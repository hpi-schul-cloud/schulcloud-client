import { pushManager } from './scripts/notificationService/index';
import messagingSW from './scripts/message/message-sw';

importScripts('/vendor-optimized/firebase/firebase-app.js');
importScripts('/vendor-optimized/firebase/firebase-messaging.js');


messagingSW.setupMessaging();

firebase.initializeApp({
	// FIXME retrieve messagingSenderId from api
	messagingSenderId: '693501688706',
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(
	// FIXME update PM to handle background message
	payload => pushManager.handleNotification(self.registration, payload),
);

// self.addEventListener('message', (event) => {
// 	// FIXME update PM to handle message
// 	event.waitUntil(pushManager.handleNotification(self.registration, event));
// });

// self.addEventListener('push', function(event){
//     const data = event.data.json();
//     console.log('push sw', data);
//     event.waitUntil(pushManager.handleNotification(self.registration, data));
// });
