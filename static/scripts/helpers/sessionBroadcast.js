export const broadcast = new BroadcastChannel('schulcloud-session');

export const notifyLogout = () => {
	broadcast.postMessage('logout');
};

export const subsscribeToLogoutBroadcast = () => {
	broadcast.onmessage = (event) => {
		if (event.data === 'logout') {
			window.location.href = '/logout';
		}
	};
};
