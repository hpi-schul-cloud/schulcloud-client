/* global firebase */
import { pushManager } from './index';
import { sendShownCallback, removeRegistrationId } from './callback';
import toast from '../toasts';

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

const updateUI = function (task) {
  if (task === 'enable-registration') {
    updateUI('hide-loading');
    var btn = document.getElementsByClassName("btn-push-disabled");
    for (var i = 0; i < btn.length; i++) {
      htmlClass.removeClass(btn[i], 'hidden');
    }
    btn = document.getElementsByClassName("btn-push-enabled");
    for (var i = 0; i < btn.length; i++) {
      htmlClass.addClass(btn[i], 'hidden');
    }
  }

  if (task === 'disable-registration') {
    updateUI('hide-loading');
    var btn = document.getElementsByClassName("btn-push-enabled");
    for (var i = 0; i < btn.length; i++) {
      htmlClass.removeClass(btn[i], 'hidden');
    }
    btn = document.getElementsByClassName("btn-push-disabled");
    for (var i = 0; i < btn.length; i++) {
      htmlClass.addClass(btn[i], 'hidden');
    }
  }

  if (task === 'hide-loading') {
    var row = document.getElementsByClassName("row-push-loading");
    for (var i = 0; i < row.length; i++) {
      htmlClass.addClass(row[i], 'hidden');
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

  function onSuccess() {
    // success cb
    updateUI('disable-registration');
    toast('notificationsEnabled');
  }
  function onError() {
    // error cb
    toast('notificationRegistrationError');
    updateUI('enable-registration');
  }

  
  function getToken() {
    
    messaging.getToken()
    .then(function (token) {
      if (token) {
        // check devices registerd
        $.post('/notification/getDevices', {}, function(data){
          if(data && data.length && data.includes(token)){
            updateUI('disable-registration');
          }else{
            updateUI('enable-registration');
          }
        }).fail(function(){
          updateUI('enable-registration');
        });
      } else {
        updateUI('enable-registration');
      }
    })
    .catch(function (err) {
      updateUI('enable-registration');
    });
  }
  
  function updateToken() {
    return messaging.getToken()
    .then(function (token) {
      if (token) {
        // push permission granted, update token
        pushManager.setRegistrationId(token, 'firebase', onSuccess, onError);
      } else {
        // push permission not granted, request permission
        pushManager.error('No Instance ID token available. Request permission to generate one.');
        // enable registration button
        updateUI('enable-registration');
      }
    });
  }
  
  
  getToken();
  
  window.requestPushPermission =   function requestPermission() {
    return messaging.requestPermission()
    .then(function () {
      return updateToken();
    })
    .catch(function (err) {
      pushManager.error(err, 'Unable to get permission to notify.');
      updateUI('enable-registration');
      toast('notificationsDisabled');
    });
    
  };
  
  pushManager.registerSuccessfulSetup('firebase', window.requestPushPermission);
  
  window.requestDisablePush = function () {
    messaging.getToken().then(token => {
      if (!token) return toast('pushNotRegistered');
      messaging.deleteToken(token);
      removeRegistrationId(token,
        function () {
          toast('pushDisabled');
          updateUI('enable-registration');
          pushManager.removePermission();
        }, function () {
          toast('errorDisablePush');
        });
    });
  };

  // Callback fired if Instance ID token is updated.
  pushManager.permissionGranted(function(){
    messaging.onTokenRefresh(updateToken);
  });

  // Handle incoming messages. Called when:
  // - a message is received while the app has focus
  // messaging.onMessage(function (payload) {
  //   console.log('frontend message received');
  //   pushManager.handleNotification(registration, payload);
  //   return Promise.resolve();
  // });
}
