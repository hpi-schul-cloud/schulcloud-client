/* global firebase */
import { pushManager } from './index';
import { sendShownCallback } from './callback';

window.pushManager = pushManager;

export function setupFirebasePush() {
  if (!window.firebase) {
    console.log('firebase missing!');
    return;
  }

  var config = {
    messagingSenderId: "876444946816"
  };

  // When app was already initialized just return.
  if (firebase.apps.length){
    console.log('apps without permission?', firebase.apps);
    return;
  }
    
  firebase.initializeApp(config);
  
  // Retrieve Firebase Messaging object.
  const messaging = firebase.messaging();

  // Change Service Worker to use another path than root
  navigator.serviceWorker.register('/scripts/notificationService/firebase-messaging-sw.js')
    .then((registration) => {
      messaging.useServiceWorker(registration);

      // Callback fired if Instance ID token is updated.
      messaging.onTokenRefresh(getToken);

      // Handle incoming messages. Called when:
      // - a message is received while the app has focus
      messaging.onMessage(function(payload) {
        //pushManager.handleNotification(payload);
          payload.data.notification = JSON.parse(payload.data.news);
          // Customize notification here
          const notificationTitle = payload.data.notification.title;
          const notificationOptions = {
              body: payload.data.notification.body,
              icon: payload.data.notification.img || '/images/cloud.png',
              data: payload.data
          };

          sendShownCallback(payload.data);

          return registration.showNotification(notificationTitle, notificationOptions);
      });

      function getToken() {
        messaging.getToken()
          .then(function(token) {
            if (token) {
              pushManager.setRegistrationId(token);
            } else {
              pushManager.error('No Instance ID token available. Request permission to generate one.');
            }
            pushManager.registerSuccessfulSetup('firebase', requestPermission);
          })
          .catch(function(err) {
            pushManager.error(err, 'Unable to retrieve refreshed token ');
          });
      }

      function requestPermission() {
        return messaging.requestPermission()
          .then(function() {
            return getToken();
          })
          .catch(function(err) {
            pushManager.error(err, 'Unable to get permission to notify.');
          });
      }

      window.requestPushPermission = requestPermission;

      getToken();
    });
}
