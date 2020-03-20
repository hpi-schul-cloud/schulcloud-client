import AlertMessageController from './helpers/AlertMessageController';

let initialized = false;
$(document).ready(() => {
	if (initialized) {
		return;
	}
	initialized = true;

	const view = document.querySelector('script[data-view]').dataset.view === 'loggedin';
	const alertMessageController = new AlertMessageController(view);

	// EBS-System | Alert
	$.ajax({
		url: '/alerts',
		type: 'GET',
		dataType: 'json',
		contentType: 'application/json',
		timeout: 5000,
	})
		.done((result) => {
			alertMessageController.showAlert(result);
		})
		.fail(() => {
			/* eslint-disable-next-line */
			console.error('Could not update alerts!');
		});
});
