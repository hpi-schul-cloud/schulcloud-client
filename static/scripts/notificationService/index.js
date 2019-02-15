import { sendRegistrationId, removeRegistrationId } from './callback';
import { notificationHandler } from './notificationHandler';

const DEFAULT_HEADERS = {};

export const pushManager = {

	setRegistrationId(id, service, successcb, errorcb) {
		sendRegistrationId(id, service, successcb, errorcb);
	},

	deleteRegistrationId(id, successcb, errorcb) {
		removeRegistrationId(id, successcb, errorcb);
	},

	async postRequest(url, data = {}, method = 'POST') {
		if (self.fetch) {
			return fetch(url, {
				method,
				body: method === 'GET' ? null : data,
				headers: DEFAULT_HEADERS,
			}).then(response => response);
		} if (self.XMLHttpRequest) {
			let xhttp;
			xhttp = new XMLHttpRequest();
			xhttp.open(method, url, false);
			for (const key in DEFAULT_HEADERS) {
				xhttp.setRequestHeader(key, DEFAULT_HEADERS[key]);
			}
			xhttp.send(method === 'GET' ? null : data);
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
		const response = await this.postRequest(`/notification/configuration/${param}`, {}, 'GET');
		const json = await response.json();
		if (cacheEnabled) {
			this.addOptionsToCache(JSON.stringify(json), param, ONE_HOUR_IN_MILLISECONDS);
		}
		return json;
	},

};


export const getCookiesMap = cookiesString => cookiesString.split(';')
	.map(cookieString => cookieString.trim().split('='))
	.reduce((acc, curr) => {
		acc[curr[0]] = curr[1];
		return acc;
	}, {});
