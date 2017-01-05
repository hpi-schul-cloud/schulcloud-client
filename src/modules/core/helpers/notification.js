import Alert from 'react-s-alert';
/** http://react-s-alert.jsdemo.be/ **/

const options = {
	position: 'top',
	beep: false,
	html: true
};

class Notification {
	constructor() {}

	showError(message) {
		Alert.error(message, options);
	}
	showInfo(message) {
		Alert.info(message, options);
	}
}

export default new Notification();
