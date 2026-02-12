export const broadcast = new BroadcastChannel('schulcloud-session');

export const notifyLogout = () => {
	broadcast.postMessage('logout');
};
