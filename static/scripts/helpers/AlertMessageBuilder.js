const moment = require('moment');

moment.locale('de'); // set the localization

function getIconTag(status) {
	switch (status) {
		case 1:
			return '<i class="fa fa-exclamation-circle text-danger"></i>';
		case 2:
			return '<i class="fa fa-check-circle text-success"></i>';
		default:
			return '';
	}
}

class AlertMessageController {
	constructor(loggedin) {
		this.loggedin = loggedin;
		this.showAlert(JSON.parse(localStorage.getItem('SC-Alerts')) || []);
	}

	buildMessage(message) {
		const date = moment(message.timestamp);
		const icon = getIconTag(message.status);

		const item = document.createElement('div');
		if (this.loggedin) {
			item.className = 'alert-item';
			item.innerHTML = `<div class="alert-date text-nowrap text-muted">${date.fromNow()}</div>
			<div class="alert-title">${icon} ${message.title}</div>
			${message.text}`;
		} else {
			item.className = 'alert alert-info alert-card';
			item.innerHTML = `<h6>${icon} ${message.title}</h6>
			<div class="text-muted" style="float: left;">${date.format('DD.MM.YYYY HH:mm')}</div> <br>
			${message.text}`;
		}
		return item;
	}

	showAlert(messageArray) {
		if (Array.isArray(messageArray)) {
			if (this.loggedin) {
				$('.alert-button').css('visibility', 'hidden');
				if (messageArray.length >= 1) {
					if (!$('body').hasClass('fullscreen')) {
						$('.alert-button').css('visibility', 'visible');
					}
					$('.alert-button').find('.js-alert-content').empty();
					messageArray.forEach((message) => {
						$('.alert-button').find('.js-alert-content').append(this.buildMessage(message));
					});
				}
			} else {
				$('.alert-section').empty();
				if (messageArray.length >= 1) {
					messageArray.forEach((message) => {
						$('.alert-section').append(this.buildMessage(message));
					});
				}
			}
		}
	}
}

export default AlertMessageController;
