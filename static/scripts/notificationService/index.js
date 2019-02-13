import { sendRegistrationId } from './callback';
import { notificationHandler } from './notificationHandler';

export const pushManager = {
	requestPermissionCallback: null,
	handledMessages: [],

	setRegistrationId(id, service, successcb, errorcb) {
		sendRegistrationId(id, service, successcb, errorcb);
	},

	handleNotification(registration, data) {
		if (this.handledMessages.includes(data.data._id) === false) {
			// this.handledMessages.push(data.data._id);
			while (this.handledMessages.length > 100) {
				this.handledMessages.shift();
			}
			console.log('notification event arrived in pushManager', data);
			return notificationHandler.handle(registration, data);
			// sendShownCallback(data);
		}
		// console.log('ignore push duplicate', data);
		return Promise.resolve('push duplicate');
	},

	requestPermission() {
		document.cookie = 'notificationPermission=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';
		if (this.requestPermissionCallback) {
			this.requestPermissionCallback(); // async, without promise
			setTimeout(() => { window.location.reload(); }, 2000);
		}
	},

	registerSuccessfulSetup(service, requestPermissionCallback) {
		// console.log('server ', service, ' is set up!');
		this.requestPermissionCallback = requestPermissionCallback;
	},

	permissionGranted(grantedcb, errorcb) {
		const cookies = getCookiesMap(document.cookie);
		if (cookies.notificationPermission) {
			if (grantedcb) grantedcb();
		} else if (errorcb) errorcb();
	},

};


export const getCookiesMap = cookiesString => cookiesString.split(';')
	.map(cookieString => cookieString.trim().split('='))
	.reduce((acc, curr) => {
		acc[curr[0]] = curr[1];
		return acc;
	}, {});
