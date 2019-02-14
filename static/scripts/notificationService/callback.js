const CALLBACK_TYPES = {
	RECEIVED: 'received',
	CLICKED: 'clicked',
	READ: 'read',
};

const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };


function postRequest(url, data = {},
	successcb = function () { },
	errorcb = function () { },
	method = 'POST') {
	const jsonData = JSON.stringify(Object.assign({}, data, { _method: method }));
	if (self.fetch) {
		fetch(url, {
			method,
			body: jsonData,
			headers: DEFAULT_HEADERS,
		}).then((response) => {
			if (response.status !== 200) {
				throw new Error(response.status);
			} return response.text();
		})
			.then(text => successcb(text))
			.catch(() => errorcb());
	} else if (self.XMLHttpRequest) {
		let xhttp;
		xhttp = new XMLHttpRequest();
		xhttp.open(method, url, true);
		for (const key in DEFAULT_HEADERS) {
			xhttp.setRequestHeader(key, DEFAULT_HEADERS[key]);
		}
		xhttp.onreadystatechange = function () {
			if (xhttp.readyState === 4) {
				if (xhttp.status === 200) {
					successcb(xhttp.responseText);
				} else {
					errorcb();
				}
			}
		};
		xhttp.send(jsonData);
		return xhttp.response;
	}
}

export function sendRegistrationId(id, service, successcb, errorcb) {
	postRequest('/notification/devices', {
		id,
		service,
	}, successcb, errorcb);
}

export function removeRegistrationId(id, successcb, errorcb) {
	postRequest('/notification/device',
		JSON.stringify({ id }),
		successcb, errorcb,
		'DELETE');
}

export function sendShownCallback(notificationData, background, url) {
	const body = {
		notificationId: notificationData.notificationId,
		type: CALLBACK_TYPES.RECEIVED,
	};

	function callback(response) {
		console.log(response);
	}

	if (background) {
		const data = JSON.stringify(body);

		return postRequest(url, data, callback);
	}

	return sendCallback(body, callback);
}

export function sendReadCallback(notificationId) {
	const body = {
		notificationId,
		type: CALLBACK_TYPES.READ,
	};

	function callback(response) {
		console.log(response);
	}

	return sendCallback(body, callback);
}


export function sendClickedCallback(notificationId, background, url) {
	const body = {
		notificationId,
		type: CALLBACK_TYPES.CLICKED,
	};

	function callback(response) {
		console.log(response);
	}

	if (background) {
		const data = JSON.stringify(body);

		return postRequest(url, data, callback);
	}

	return sendCallback(body, callback);
}

function sendCallback(body, callback) {
	postRequest('/notification/callback', body);
}
