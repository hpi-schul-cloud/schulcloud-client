function extractRoomId(matrixUserId) {
	if (!matrixUserId) {
		return '';
	}
	const servername = matrixUserId.substr(matrixUserId.indexOf(':') + 1);

	// extract room id from url
	let roomId = null;
	let roomType = null;
	const { pathname } = window.location;
	// > from course
	const courseMatches = RegExp('/courses/([^/]+).*').exec(pathname);
	if (courseMatches && courseMatches.length >= 2 && courseMatches[1] !== 'add') {
		roomId = courseMatches[1];
		roomType = 'course';
	}
	// > from team
	const teamMatches = RegExp('/teams/([^/]+).*').exec(pathname);
	if (teamMatches && teamMatches.length >= 2 && teamMatches[1] !== 'add') {
		roomId = teamMatches[1];
		roomType = 'team';
	}

	if (!roomId || !roomType || !servername) {
		return '';
	}

	// build matrix room id
	return `#${roomType}_${roomId}:${servername}`;
}

function loadChatClient(session = null) {
	// extract user id
	let matrixUserId = '';
	if (session) {
		matrixUserId = session.userId;
	} else {
		matrixUserId = window.localStorage.getItem('mx_user_id');
	}

	// create chat tag
	const riotBox = document.createElement('section');
	riotBox.id = 'matrixchat';
	riotBox.dataset.vectorIndexeddbWorkerScript = '/indexeddb-worker.js';
	riotBox.dataset.vectorConfig = '/riot_config.json';
	riotBox.dataset.vectorDefaultToggled = 'true';
	riotBox.dataset.matrixLang = 'de';
	riotBox.dataset.matrixRoomId = extractRoomId(matrixUserId);

	if (session) {
		riotBox.dataset.matrixHomeserverUrl = session.homeserverUrl;
		riotBox.dataset.matrixUserId = session.userId;
		riotBox.dataset.matrixAccessToken = session.accessToken;
		riotBox.dataset.maxtrixDeviceId = session.deviceId;
	}
	document.body.appendChild(riotBox);

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

function requestSession() {
	return $.getJSON('/messenger/token');
}

function ready() {
	if (window.innerWidth < 768) { // breakpoint: md
		return; // screen to small to use embedded messenger
	}

	// Find Matrix Session
	// > in localstorage?
	if (window.localStorage
		&& window.localStorage.getItem('mx_hs_url')
		&& window.localStorage.getItem('mx_access_token')
		&& window.localStorage.getItem('mx_user_id')
	) {
		// session available, the chat will access it itself
		loadChatClient();
	} else {
		// > get new Session from Server and pass it to the chat
		requestSession()
			.then(loadChatClient)
			.catch((error) => {
				/* eslint-disable-next-line no-console */
				console.error('Failed to request Messenger Session.', error);
			});
	}
}

$(document).ready(ready);
