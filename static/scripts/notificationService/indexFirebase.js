/* global firebase */
import { pushManager } from './index';
import { sendShownCallback } from './callback';

const htmlClass = {
  hasClass: function (el, className) {
    if (el.classList)
      return el.classList.contains(className);
    return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
  },

  addClass: function (el, className) {
    if (el.classList)
      el.classList.add(className);
    else if (!this.hasClass(el, className))
      el.className += " " + className;
  },

  removeClass: function (el, className) {
    if (el.classList)
      el.classList.remove(className);
    else if (this.hasClass(el, className)) {
      var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
      el.className = el.className.replace(reg, ' ');
    }
  }
};

const updateUI = function(task){
  if(task === 'enable-registration'){
    var btn = document.getElementsByClassName("btn-push-disabled");
    for (var i = 0; i < btn.length; i++) {
      htmlClass.removeClass(btn[i], 'hidden');
    }
    btn = document.getElementsByClassName("btn-push-enabled");
    for (var i = 0; i < btn.length; i++) {
      htmlClass.addClass(btn[i], 'hidden');
    }
  }

  if(task === 'disable-registration'){
    var btn = document.getElementsByClassName("btn-push-enabled");
    for (var i = 0; i < btn.length; i++) {
      htmlClass.removeClass(btn[i], 'hidden');
    }
    btn = document.getElementsByClassName("btn-push-disabled");
    for (var i = 0; i < btn.length; i++) {
      htmlClass.addClass(btn[i], 'hidden');
    }
  }
};



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

  messaging.useServiceWorker(registration);

  function getToken() {
    messaging.getToken()
      .then(function (token) {
        if (token) {
          // push permission granted
          pushManager.setRegistrationId(token, 'firebase');
          // disable registration button
          updateUI('disable-registration');
          // todo alert success
          iziToast.show({
            title: 'Einstellungen wurden erfolgreich aktualisiert!',
            message: 'Push-Benachrichtigungen sind für dieses Gerät aktiviert.'
          });
        } else {
          // push permission not granted, request permission
          pushManager.error('No Instance ID token available. Request permission to generate one.');
          // enable registration button
          updateUI('enable-registration');
          iziToast.show({
            title: 'Push-Benachrichtigungen deaktiviert!',
            message: 'Warum solltest du Push-Benachrichtigungen für dieses Gerät aktivieren?'
          });
        }
        pushManager.registerSuccessfulSetup('firebase', requestPermission);
      })
      .catch(function (err) {
        // push disabled
        pushManager.error(err, 'Unable to retrieve refreshed token ');
        updateUI('enable-registration');
      });
  }

  function requestPermission() {
    return messaging.requestPermission()
      .then(function () {
        return getToken();
      })
      .catch(function (err) {
        pushManager.error(err, 'Unable to get permission to notify.');
        updateUI('enable-registration');
        alert(err.code);
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
