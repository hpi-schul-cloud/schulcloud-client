// these constants are also used inside of the nuxt-client to communicate logouts between both application parts
const BROADCAST_CHANNEL_NAME = 'user-session-channel';
const BROADCAST_MESSAGE_LOGOUT = 'logout';

export const broadcast = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

export const notifyLogout = () => {
	broadcast.postMessage(BROADCAST_MESSAGE_LOGOUT);
};

broadcast.onmessage = (event) => {
	if (event.data === BROADCAST_MESSAGE_LOGOUT) {
		window.location.href = '/logout';
	}
	if (event.data === 'expired') {
		window.location.href = '/logout';
	}
};

export const subscribeToLogoutBroadcast = () => {
	broadcast.onmessage = (event) => {
		if (event.data === 'logout') {
			window.location.href = '/logout';
		}
	};
};
