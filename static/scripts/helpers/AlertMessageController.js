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

		// show only 150 charckters of message
		let messageText;
		if (message.text.length > 60) {
			messageText = `${message.text.substring(0, 60)}...`;
		} else {
			messageText = message.text;
		}

		// if message includes url
		let url = '';
		if (message.url) {
			url = `
				<a href="${message.url}" rel="noopener" target="_blank" style="float: right;">
					${message.url.replace(/(^\w+:|^)\/\//, '')}
				</a>
				`;
		}

		const item = document.createElement('div');
		if (this.loggedin) {
			item.className = 'alert-item';
			item.innerHTML = `<div class="alert-date text-nowrap text-muted">${date.fromNow()}</div>
			<div class="alert-title">${icon} ${message.title}</div>
			${message.text}
			${url}
			<div style="clear: both;"></div>`;
		} else {
			item.className = 'alert alert-info alert-card';
			item.innerHTML = `<h6>${icon} ${message.title}</h6>
			<div class="text-muted" style="float: left;">${date.format('DD.MM.YYYY HH:mm')}</div> <br>
			${messageText}
			${url}
			<div style="clear: both;"></div>`;
		}
		return item;
	}

	showAlert(messageArray) {
		if (Array.isArray(messageArray)) {
			// keep data in local storage
			// silently overwrite old data
			localStorage.setItem('SC-Alerts', JSON.stringify(messageArray));
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
