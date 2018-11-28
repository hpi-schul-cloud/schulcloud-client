/* global firebase */
import { pushManager } from './index';
import { sendShownCallback } from './callback';


export function setupFirebasePush(registration) {
  if (!window.firebase) {
    console.log('firebase missing!');
    return;
  }

  var config = {
    messagingSenderId: "693501688706"
  };

  // When app was already initialized just return.
  if (firebase.apps.length) {
    console.log('apps without permission?', firebase.apps);
    return;
  }

  firebase.initializeApp(config);

  // Retrieve Firebase Messaging object.
  const messaging = firebase.messaging();

  // Change Service Worker to use another path than root

  messaging.useServiceWorker(registration);

  function getToken() {
    messaging.getToken()
      .then(function (token) {
        if (token) {
          pushManager.setRegistrationId(token, 'firebase');
        } else {
          // todo request permission
          pushManager.error('No Instance ID token available. Request permission to generate one.');
          requestPermission();
        }
        pushManager.registerSuccessfulSetup('firebase', requestPermission);
      })
      .catch(function (err) {
        pushManager.error(err, 'Unable to retrieve refreshed token ');
      });
  }

  function requestPermission() {
    return messaging.requestPermission()
      .then(function () {
        return getToken();
      })
      .catch(function (err) {
        pushManager.error(err, 'Unable to get permission to notify.');
      });
  }
  window.requestPushPermission = requestPermission;


  // Callback fired if Instance ID token is updated.
  messaging.onTokenRefresh(getToken);

  // Handle incoming messages. Called when:
  // - a message is received while the app has focus
  // messaging.onMessage(function (payload) {
  //   console.log('frontend message received');
  //   pushManager.handleNotification(registration, payload);
  //   return Promise.resolve();
  // });

  getToken();
}
