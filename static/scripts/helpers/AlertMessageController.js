/* eslint-disable max-len */
const datetime = require('../datetime/datetime');

function getIconTag(status) {
	switch (status) {
		case 'danger':
			$('.alert-button').addClass('danger');
			return '<i class="fa fa-exclamation-circle text-danger"></i>';
		case 'info':
			$('.alert-button').addClass('info');
			return '<i class="fa fa-info-circle text-info"></i>';
		default:
			return '<i class="fa fa-info-circle text-info"></i>';
	}
}

class AlertMessageController {
	constructor(loggedin) {
		this.loggedin = loggedin;
		this.showAlert(JSON.parse(localStorage.getItem('SC-Alerts')) || []);
	}

	buildMessage(message) {
		const icon = getIconTag(message.status);

		const item = document.createElement('div');
		if (this.loggedin) {
			item.className = 'alert-item';
			item.innerHTML = `
			<div class="alert-title">${icon} ${message.title}</div>
			${message.text}
			<br>
			<div class="alert-date text-nowrap text-muted" style="float: left;">Updated: ${datetime.fromNow(message.timestamp)}</div>
			<div class="alert-date text-nowrap text-muted" style="float: left;"> <span class="statusAlertDivider"> | </span> Created: ${datetime.toDateTimeString(message.created_at)}</div>
			<div style="clear: both;"></div>`;
		} else {
			item.className = 'alert alert-info alert-card';
			item.innerHTML = `<h6 style="overflow: hidden; text-overflow: ellipsis;">${icon} ${message.title}</h6>
			${message.text}
			<br>
			<div class="text-muted" style="float: left;"> Updated: ${datetime.toDateTimeString(message.timestamp)}</div>
			<div class="text-muted" style="float: left;"> <span style="margin-right: 5px;"> | </span> Created: ${datetime.toDateTimeString(message.created_at)}</div>
			<div style="clear: both;"></div>`;
		}
		return item;
	}

	showAlert(messageArray) {
		if (!messageArray || messageArray.length === 0) {
			return; // If messageArray is empty, we do not show the triangle
		}
		if (Array.isArray(messageArray)) {
			// keep data in local storage
			// silently overwrite old data
			localStorage.setItem('SC-Alerts', JSON.stringify(messageArray));
			if (this.loggedin) {
				$('.alert-button').css('visibility', 'hidden');
				if (messageArray) {
					if (!$('body').hasClass('fullscreen')) {
						$('.alert-button').css('visibility', 'visible');
					}
					$('.alert-button').find('.js-alert-content').empty();
					messageArray.forEach((message) => {
						if (message) {
							$('.alert-button').find('.js-alert-content').append(this.buildMessage(message));
						}
					});
				}
			}
		}
	}
}

export default AlertMessageController;
