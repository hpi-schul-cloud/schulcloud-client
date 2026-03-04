// these constants are also used inside of the nuxt-client to communicate logouts between both application parts
const BROADCAST_CHANNEL_NAME = 'user-session-channel';
const BROADCAST_MESSAGE_LOGOUT = 'logout';

export const broadcast = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

export const notifyLogout = () => {
	console.log('send logout message to other tabs');
	broadcast.postMessage(BROADCAST_MESSAGE_LOGOUT);
};

broadcast.onmessage = (event) => {
	console.log('Received message:', event.data);
	if (event.data === BROADCAST_MESSAGE_LOGOUT) {
		console.log('Received "logout" message, logging out...');
		window.location.href = '/logout';
	}
	if (event.data === 'expired') {
		console.log('Received "expired" message, showing auto logout modal...');
		window.location.href = '/logout';
	}
};
