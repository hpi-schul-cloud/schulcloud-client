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

	// create chat tag
	const riotBox = document.createElement('section');
	riotBox.id = 'matrixchat';
	riotBox.dataset.vectorIndexeddbWorkerScript = '/indexeddb-worker.js';
	riotBox.dataset.vectorConfig = '/riot_config.json';
	riotBox.dataset.vectorDefaultToggled = 'true';
	riotBox.dataset.matrixLang = window.userLanguage || 'de';

	// force the selection of a specific room
	if (matrixRoomId) {
		riotBox.dataset.matrixRoomId = matrixRoomId;
	}

	if (session) {
		riotBox.dataset.matrixHomeserverUrl = session.homeserverUrl;
		riotBox.dataset.matrixUserId = session.userId;
		riotBox.dataset.matrixAccessToken = session.accessToken;
		riotBox.dataset.maxtrixDeviceId = session.deviceId;
	}
	document.body.appendChild(riotBox);
}

function loadMessengerBundle() {
	// load javascript
	const bundle = window.matrixBundle;
	if (!bundle) {
		throw new Error('window.matrixBundle has to be defined.');
	}
	const riotScript = document.createElement('script');
	riotScript.src = bundle;
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
	loadMessengerBundle();
}

let onReadyTriggered = false;

async function onDocumentReady() {
	if (window.innerWidth < 768) { // breakpoint: md
		return false; // screen to small to use embedded messenger
	}
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
