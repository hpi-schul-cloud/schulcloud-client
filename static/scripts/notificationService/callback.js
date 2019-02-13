const CALLBACK_TYPES = {
	RECEIVED: 'received',
	CLICKED: 'clicked',
	READ: 'read',
};

const DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
};

export function sendRegistrationId(id, service, successcb, errorcb) {
	$.post('/notification/devices', {
		id,
		service,
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
	$.post('/notification/callback', body);
}
