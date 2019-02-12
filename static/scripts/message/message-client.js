/* eslint-disable no-undef */
const messageClient = {

	registration: null,

	setupMessagingClient(registration) {
		if (!('serviceWorker' in navigator)) {
			console.error('serviceWorker not supported!');
			return;
		}

		this.registration = registration;

		const that = this;

		window.addEventListener('focus', () => { that.onFocusChange('focus'); });
		window.addEventListener('blur', () => { that.onFocusChange('blur'); });
		if (document.hasFocus()) {
			that.onFocusChange('focus');
		} else {
			that.onFocusChange('blur');
		}

		navigator.serviceWorker.addEventListener('message', (event) => {
			// console.log('client received:', event.data);
			if (event.data.notification && event.data.notification.shown) {
				iziToast.show({
					title: event.data.notification.title,
					message: event.data.notification.body,
				});
			}
		});
	},

	onFocusChange(activity) {
		// if(this.registration){
		//     this.registration.showNotification(activity);
		// }
		this.updateRegistration(activity);
	},

	updateRegistration(activity) {
		if (this.serviceWorkerEnabled()) {
			navigator.serviceWorker.controller.postMessage({
				tag: 'client-focus-change',
				data: {
					activity,
				},
			});
		}
	},

	serviceWorkerEnabled() {
		if (!(navigator.serviceWorker && navigator.serviceWorker.controller)) {
			console.error('serviceWorker currently disabled!');
			return false;
		}
		return true;
	},

};

module.exports = messageClient;
