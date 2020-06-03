const AUTO_SELECT_ROOM_SCOPES = [
	'course',
	'team',
];

function findMatrixUserId(session = null) {
	if (session) {
		return session.userId;
	}

	return window.localStorage.getItem('mx_user_id');
}

function extractRoomTypeAndIdFromPath(path) {
	const scopes = AUTO_SELECT_ROOM_SCOPES.join('|');
	const matches = RegExp(`^/(${scopes})s/([0-9a-f]{24})`)
		.exec(path);
	if (matches && matches.length >= 3) {
		return {
			roomType: matches[1],
			roomId: matches[2],
		};
	}

	return {
		roomType: null,
		roomId: null,
	};
}

function extractServernameFromMatrixUserId(matrixUserId) {
	if (!matrixUserId) {
		return null;
	}
	return matrixUserId.substr(matrixUserId.indexOf(':') + 1);
}

function composeMatrixRoomId(roomType, roomId, servername) {
	if (!roomId || !roomType || !servername) {
		return null;
	}

	// build matrix room id
	return `#${roomType}_${roomId}:${servername}`;
}

function addMatrixchatElement(session) {
	const matrixUserId = findMatrixUserId(session);
	const { roomType, roomId } = extractRoomTypeAndIdFromPath(window.location.pathname);
	const servername = extractServernameFromMatrixUserId(matrixUserId);
	const matrixRoomId = composeMatrixRoomId(roomType, roomId, servername);

	// base options
	const options = {
		riotConfig: '/riot_config.json',
		indexeddbWorkerScript: '/indexeddb-worker.js',
		assetDomain: `${window.matrixAssetDomain}/`,
		language: window.userLanguage || 'de',
		forceToggled: true,
	};

	// force the selection of a specific room
	if (matrixRoomId) {
		options.roomId = matrixRoomId;
	}

	// apply session
	if (session) {
		options.homeserverUrl = session.homeserverUrl;
		options.userId = session.userId;
		options.accessToken = session.accessToken;
		options.deviceId = session.deviceId;
	}

	window.Matrix = window.Matrix || [];
	window.Matrix.push(['setup', options]);
}

function loadMessengerEmbed() {
	// load javascript
	const riotScript = document.createElement('script');
	riotScript.src = `${window.matrixAssetDomain}/embed.js`;
	riotScript.type = 'text/javascript';
	document.head.appendChild(riotScript);
}

function hasActiveSessionInLocalStorage() {
	return window.localStorage
		&& window.localStorage.getItem('mx_hs_url')
		&& window.localStorage.getItem('mx_access_token')
		&& window.localStorage.getItem('mx_user_id');
}

function requestSession() {
	return $.getJSON('/messenger/token');
}

async function initializeMessenger() {
	// Find Matrix Session
	let session;
	if (hasActiveSessionInLocalStorage()) {
		// session available, the messenger will access it itself
		session = null;
	} else {
		// get new session from Server
		session = await requestSession();
	}

	addMatrixchatElement(session);
	loadMessengerEmbed();
}

let onReadyTriggered = false;

async function onDocumentReady() {
	// ensure that the initialization is only triggered once
	if (onReadyTriggered) {
		return false;
	}
	onReadyTriggered = true;

	await initializeMessenger();
	return true;
}

$(document)
	.ready(onDocumentReady);
