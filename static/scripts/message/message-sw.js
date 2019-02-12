import { pushManager } from '../notificationService/index';

const messagingSW = {

	clientFocused: false,

	setupMessaging() {
		const that = this;
		self.addEventListener('message', (event) => {
			if (event.data && event.data.tag) {
				switch (event.data.tag) {
					case 'client-focus-change':
						if (event.data.data.activity === 'focus') {
							that.clientFocused = true;
						} else {
							that.clientFocused = false;
						}
						break;
					default: break;
				}
			}
		});

		self.addEventListener('push', (event) => {
			const message = event.data.json();

			// mark message notification as seen if any client is focused
			if (message.notification) {
				message.notification.shown = that.clientFocused;
			}

			const pChain = [];

			// send message for visible toast or action to client
			pChain.push(self.clients.matchAll()
				.then(clients => clients
					.map(client => client.postMessage(message)))
				.then(clients => Promise.all(clients)));

			// handle message in sw
			pChain.push(pushManager.handleNotification(self.registration, message));

			event.waitUntil(pChain);
		});
	},


};

module.exports = messagingSW;
