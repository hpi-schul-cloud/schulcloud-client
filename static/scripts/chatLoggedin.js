function loadChatClient(session = null) {
	let roomIdentifier = '';
	const matches = RegExp('/courses/([^/]+).*').exec(window.location.pathname)
	if (matches && matches.length >= 2) {
		roomIdentifier = `#course_${matches[1]}:matrix.stomt.com`;
	}

	// create chat tag
	const riotBox = document.createElement('section');
	riotBox.id = 'matrixchat';
	riotBox.dataset.vectorIndexeddbWorkerScript = '/indexeddb-worker.js';
	riotBox.dataset.vectorConfig = '/riot_config.json';
	riotBox.dataset.vectorDefaultToggled = 'true';
	riotBox.dataset.matrixRoomId = roomIdentifier;
	riotBox.dataset.matrixLang = 'de';

	if (session) {
		riotBox.dataset.matrixHomeserverUrl = session.homeserverUrl;
		riotBox.dataset.matrixUserId = session.userId;
		riotBox.dataset.matrixAccessToken = session.accessToken;
	}
	document.body.appendChild(riotBox);

	// load javascript
	const riotScript = document.createElement('script');
	riotScript.src = 'https://embed.stomt.com/bundles/bbf7f874b7f3891917fb/bundle.js';
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
