let CALLBACK_TYPES = {
	RECEIVED: 'received',
	CLICKED: 'clicked',
	READ: 'read',
};

let DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
};

export function sendRegistrationId(id, service, device, type, name, successcb, errorcb) {
	$.post('/notification/devices', {
		id,
		service,
		device,
		type,
		name,
	}, (data) => {
        successcb(data);
    }).fail(() => {
        errorcb();
    });
}

export function removeRegistrationId(id, successcb, errorcb) {
	$.ajax({
		url: '/notification/device',
		type: 'DELETE',
		success: successcb,
		data: JSON.stringify({ id }),
		contentType: 'application/json',
	}).fail(() => { errorcb(); });
}

export function sendShownCallback(notificationData, background, url) {
	let body = {
		notificationId: notificationData.notificationId,
		type: CALLBACK_TYPES.RECEIVED,
	};

	function callback(response) {
		console.log(response);
	}

	if (background) {
		let data = JSON.stringify(body);

		return postRequest(url, data, callback);
	}

	return sendCallback(body, callback);
}

export function sendReadCallback(notificationId) {
	let body = {
		notificationId,
		type: CALLBACK_TYPES.READ,
	};

	function callback(response) {
		console.log(response);
	}

	return sendCallback(body, callback);
}


export function sendClickedCallback(notificationId, background, url) {
	let body = {
		notificationId,
		type: CALLBACK_TYPES.CLICKED,
	};

	function callback(response) {
		console.log(response);
	}

	if (background) {
		let data = JSON.stringify(body);

		return postRequest(url, data, callback);
	}

	return sendCallback(body, callback);
}

function sendCallback(body, callback) {
	$.post('/notification/callback', body);
}

function postRequest(url, data, callback) {
	if (self.fetch) {
		fetch(url, {
			method: 'POST',
			body: data,
			headers: DEFAULT_HEADERS,
		})
			.then((response) => {
                response.json().then(function (json) {
                    callback(json);
                });
            });
	} else if (self.XMLHttpRequest) {
		let xhttp;
		xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function () {
			if (this.readyState === 4 && this.status === 201) {
				let response = JSON.parse(xhttp.responseText);
				callback(response);
			}
		};
		xhttp.open('POST', url, true);
		xhttp.setRequestHeader('Content-type', DEFAULT_HEADERS['Content-Type']);
		xhttp.send(data);
	} else {
		console.log('No way to send out', data);
	}
}
