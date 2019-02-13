import { sendRegistrationId, removeRegistrationId } from './callback';
import { notificationHandler } from './notificationHandler';

const DEFAULT_HEADERS = {};

export const pushManager = {
	requestPermissionCallback: null,
	handledMessages: [],

	setRegistrationId(id, service, successcb, errorcb) {
		sendRegistrationId(id, service, successcb, errorcb);
	},

	deleteRegistrationId(id, successcb, errorcb) {
		removeRegistrationId(id, successcb, errorcb);
	},

	async postRequest(url, data = {}) {
		if (self.fetch) {
			return fetch(url, {
				method: 'POST',
				body: data,
				headers: DEFAULT_HEADERS,
			}).then(response => response);
		} if (self.XMLHttpRequest) {
			let xhttp;
			xhttp = new XMLHttpRequest();
			xhttp.open('POST', url, false);
			for (const key in DEFAULT_HEADERS) {
				xhttp.setRequestHeader(key, DEFAULT_HEADERS[key]);
			}
			xhttp.send(data);
			return xhttp.response;
		}
	},

	optionsInCache(key, timeoutMillis) {
		if (timeoutMillis) {
			const added = localStorage.getItem(`${key}AddedAt`);
			if (added !== null && parseInt(added) > (Date.now() - timeoutMillis)) {
				return true;
			} return false;
		}
		return localStorage.getItem(key) !== null;
	},

	optionsFromCache(key) {
		return localStorage.getItem(key);
	},

	addOptionsToCache(str, key, timeoutMillis) {
		localStorage.setItem(key, str);
		if (timeoutMillis) {
			localStorage.setItem(`${key}AddedAt`, Date.now());
		}
	},

	async getOptions(param, cacheEnabled) {
		// set chache time duration
		const ONE_HOUR_IN_MILLISECONDS = 3600000;
		if (cacheEnabled && this.optionsInCache(param, ONE_HOUR_IN_MILLISECONDS)) {
			return JSON.parse(this.optionsFromCache(param));
		}
		const response = await this.postRequest(`/notification/configuration/${param}`);
		const json = await response.json();
		if (cacheEnabled) {
			this.addOptionsToCache(JSON.stringify(json), param, ONE_HOUR_IN_MILLISECONDS);
		}
		return json;
	},

	handleNotification(registration, data, origin) {
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
