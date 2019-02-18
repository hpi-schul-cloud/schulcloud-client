/* global firebase */
import { pushManager } from './index';
import toast from '../toasts';

// check https://github.com/firebase/quickstart-js/tree/master/messaging for updating this file.

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

const updateUI = function (task, error) {
	if (task === 'pushPermissionRequired') {
		updateUI('hide-loading');
		let btn = document.getElementsByClassName('btn-push-disabled');
		for (var i = 0; i < btn.length; i++) {
			htmlClass.removeClass(btn[i], 'hidden');
		}
		btn = document.getElementsByClassName('btn-push-enabled');
		for (var i = 0; i < btn.length; i++) {
			htmlClass.addClass(btn[i], 'hidden');
		}
	}

	if (task === 'pushPermissionGranted') {
		updateUI('hide-loading');
		let btn = document.getElementsByClassName('btn-push-enabled');
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
		const info = document.getElementsByClassName('row-push-loaded');
		for (var i = 0; i < info.length; i++) {
			htmlClass.removeClass(info[i], 'hidden');
		}
	}

	if (task === 'pushNotSupported') {
		$('#notificationInit').hide();
		$('#notificationError').show();
		$('.notificationStatusInfo').text('Push-Benachrichtigungen für deinen Browser werden derzeit noch nicht unterstützt.');
		console.log(error.message);
	}
};


async function setupFirebasePush(registration) {
	if (!window.firebase) {
		console.log('firebase missing!');
		return;
	}

	const config = await pushManager.getOptions('firebaseOptions', true);

	firebase.initializeApp(config);
	let messaging;
	try {
		messaging = firebase.messaging();
	} catch (error) {
		updateUI('pushNotSupported', error);
		return;
	}

	function isTokenSentToServer() {
		return window.localStorage.getItem('firebaseTokenSentToServer') === '1';
	}
	function setTokenSentToServer(sent) {
		window.localStorage.setItem('firebaseTokenSentToServer', sent ? '1' : '0');
	}


	// requests push permission has been disabled using disable button
	function hasRegistrationPermission() {
		return window.localStorage.getItem('firebasePermissionGranted') === '1';
	}
	// used to not re-enable push when disabled without revoking permission
	function setRegistrationPermission(granted) {
		window.localStorage.setItem('firebasePermissionGranted', granted ? '1' : '0');
	}

	function onSuccess() {
		// success cb
		toast('notificationsEnabled');
		updateUI('pushPermissionGranted');
	}

	function onError() {
		// error cb
		toast('notificationRegistrationError');
		updateUI('pushPermissionRequired');
	}


	// Send the Instance ID token your application server, so that it can:
	// - send messages back to this app
	// - subscribe/unsubscribe the token from topics
	function sendTokenToServer(currentToken) {
		pushManager.setRegistrationId(currentToken, 'firebase', () => {
			// success
			setTokenSentToServer(true);
			onSuccess();
		}, () => {
			// error
			setTokenSentToServer(false);
			onError();
		});
	}

	function refreshUI() {
		// Get Instance ID token. Initially this makes a network call, once retrieved
		// subsequent calls to getToken will return from cache.
		if (hasRegistrationPermission()) {
			messaging.getToken().then((currentToken) => {
				if (currentToken) {
					if (!isTokenSentToServer()) {
						sendTokenToServer(currentToken);
					} else {
						updateUI('pushPermissionGranted');
					}
				} else {
					// Show permission UI.
					updateUI('pushPermissionRequired');
					setTokenSentToServer(false);
				}
			}).catch(() => {
				updateUI('pushPermissionRequired');
				setTokenSentToServer(false);
			});
		} else {
			updateUI('pushPermissionRequired');
		}
	}

	// handle token updates if permission granted
	if (hasRegistrationPermission()) {
		messaging.onTokenRefresh(() => {
			messaging.getToken().then((refreshedToken) => {
				setTokenSentToServer(false);
				sendTokenToServer(refreshedToken);
				refreshUI();
			}).catch((err) => {
				toast('pushTokenUpdateError');
			});
		});
	}

	function requestPermission() {
		setRegistrationPermission(true);
		messaging.requestPermission().then(() => {
			setTokenSentToServer(false);
			refreshUI();
		}).catch(() => {
			toast('notificationsDisabled');
		});
	}

	function deleteToken() {
		messaging.getToken().then((currentToken) => {
			messaging.deleteToken(currentToken).then(() => {
				setTokenSentToServer(false);
				pushManager.deleteRegistrationId(currentToken,
					() => {
						toast('pushDisabled');
					}, () => {
						toast('errorDisablePush');
					});
				setRegistrationPermission(false);
				updateUI('pushPermissionRequired');
			}).catch((err) => {
				// error on token removal
				toast('errorDisablePush');
			});
		}).catch((err) => {
			// error retrieving registration token
			toast('errorDisablePush');
		});
	}


	refreshUI();

	window.requestPushPermission = function () {
		requestPermission();
	};

	window.requestDisablePush = function () {
		deleteToken();
	};

	// Handle incoming messages. Called when:
	// - a message is received while the app has focus
	// messaging.onMessage(payload => pushManager.handleNotification(registration, payload, 'frontend'));
}

module.exports = { setupFirebasePush };
