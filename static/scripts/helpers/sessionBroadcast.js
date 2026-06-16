// these constants are also used inside of the nuxt-client to communicate logouts between both application parts
const BROADCAST_CHANNEL_NAME = 'user-session-channel';
const BROADCAST_MESSAGE_LOGOUT = 'logout';
export const BROADCAST_MESSAGE_TIME_UPDATED = 'time-updated';

export const broadcast = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

export const notifyLogout = () => {
	setTimeout(() => {
		broadcast.postMessage(BROADCAST_MESSAGE_LOGOUT);
		broadcast.close();
	}, 1000);
};

broadcast.onmessage = (event) => {
	if (event.data === BROADCAST_MESSAGE_LOGOUT) {
		const csrfMetaTag = document.querySelector('meta[name="csrfToken"]');
		if (csrfMetaTag) {
			csrfMetaTag.setAttribute('content', '');
		}
		setTimeout(() => {
			document.location.href = '/login?auto-logout=true';
		}, 5000);
	}
};
