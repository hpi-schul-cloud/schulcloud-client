import Alert from 'react-s-alert';
/** http://react-s-alert.jsdemo.be/ **/
class Notification {
	constructor() {}

	showError(message) {
		Alert.error(message, {
			position: 'top',
			effect: 'jelly',
			beep: false,
			timeout: 'none'
		});
	}
	showInfo(message) {
		Alert.info(message, {
			position: 'top',
			effect: 'jelly',
			beep: false,
			timeout: 'none'
		});
	}
}

export default new Notification();
