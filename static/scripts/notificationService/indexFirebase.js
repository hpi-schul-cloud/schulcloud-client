/* global firebase */
import { pushManager } from './index';
import { sendShownCallback, removeRegistrationId } from './callback';
import toast from '../toasts';

// check https://github.com/firebase/quickstart-js/blob/master/messaging/index.html#L123 for updating this file.

const htmlClass = {
	hasClass(el, className) {
		if (el.classList) { return el.classList.contains(className); }
		return !!el.className.match(new RegExp(`(\\s|^)${className}(\\s|$)`));
	},

	addClass(el, className) {
		if (el.classList) { el.classList.add(className); } else if (!this.hasClass(el, className)) { el.className += ` ${className}`; }
	},

	removeClass(el, className) {
		if (el.classList) { el.classList.remove(className); } else if (this.hasClass(el, className)) {
			const reg = new RegExp(`(\\s|^)${className}(\\s|$)`);
			el.className = el.className.replace(reg, ' ');
		}
	},
};

const updateUI = function (task) {
	if (task === 'enable-registration') {
		updateUI('hide-loading');
		var btn = document.getElementsByClassName('btn-push-disabled');
		for (var i = 0; i < btn.length; i++) {
			htmlClass.removeClass(btn[i], 'hidden');
		}
		btn = document.getElementsByClassName('btn-push-enabled');
		for (var i = 0; i < btn.length; i++) {
			htmlClass.addClass(btn[i], 'hidden');
		}
	}

	if (task === 'disable-registration') {
		updateUI('hide-loading');
		var btn = document.getElementsByClassName('btn-push-enabled');
		for (var i = 0; i < btn.length; i++) {
			htmlClass.removeClass(btn[i], 'hidden');
		}
		btn = document.getElementsByClassName('btn-push-disabled');
		for (var i = 0; i < btn.length; i++) {
			htmlClass.addClass(btn[i], 'hidden');
		}
	}

	if (task === 'hide-loading') {
		const row = document.getElementsByClassName('row-push-loading');
		for (var i = 0; i < row.length; i++) {
			htmlClass.addClass(row[i], 'hidden');
		}
	}
};


function setupFirebasePush(registration) {
	if (!window.firebase) {
		console.log('firebase missing!');
		return;
	}

	const config = {
		messagingSenderId: '693501688706',
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
			.then((token) => {
				if (token) {
					// check devices registerd
					$.post('/notification/getDevices', {}, (data) => {
						if (data && data.length && data.includes(token)) {
							updateUI('disable-registration');
						} else {
							updateUI('enable-registration');
						}
					}).fail(() => {
						updateUI('enable-registration');
					});
				} else {
					updateUI('enable-registration');
				}
			})
			.catch((err) => {
				updateUI('enable-registration');
			});
	}

	function updateToken() {
		return messaging.getToken()
			.then((token) => {
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

	window.requestPushPermission = function requestPermission() {
		return messaging.requestPermission()
			.then(() => updateToken())
			.catch((err) => {
				pushManager.error(err, 'Unable to get permission to notify.');
				updateUI('enable-registration');
				toast('notificationsDisabled');
			});
	};

	pushManager.registerSuccessfulSetup('firebase', window.requestPushPermission);

	window.requestDisablePush = function () {
		messaging.getToken().then((token) => {
			if (!token) return toast('pushNotRegistered');
			messaging.deleteToken(token);
			removeRegistrationId(token,
				() => {
					toast('pushDisabled');
					updateUI('enable-registration');
					pushManager.removePermission();
				}, () => {
					toast('errorDisablePush');
				});
		});
	};

	// Callback fired if Instance ID token is updated.
	pushManager.permissionGranted(() => {
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

module.exports = { setupFirebasePush };
