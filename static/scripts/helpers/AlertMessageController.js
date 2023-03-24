const datetime = require('../datetime/datetime');

const max = 10;

function getIconTag(status) {
	switch (status) {
		case 'danger':
			$('.alert-button').addClass('danger');
			return '<i class="fa fa-exclamation-circle text-danger"></i>';
		case 'done':
			return '<i class="fa fa-check-circle text-success"></i>';
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

		// show only 150 charckters of message
		let messageText;
		if (message.text.length > 113) {
			messageText = `${message.text.substring(0, 113)}...`;
		} else {
			messageText = message.text;
		}

		const item = document.createElement('div');
		if (this.loggedin) {
			item.className = 'alert-item';
			item.innerHTML = `
			<div class="alert-title">${icon} ${message.title}</div>
			${message.text}
			<br>
			<div class="alert-date text-nowrap text-muted">Created:${datetime.toDateTimeString(message.created)}</div>
			<div class="alert-date text-nowrap text-muted">Upated:${datetime.fromNow(message.timestamp)}</div>
			<div style="clear: both;"></div>`;
		} else {
			item.className = 'alert alert-info alert-card';
			item.innerHTML = `<h6 style="overflow: hidden; text-overflow: ellipsis;">${icon} ${message.title}</h6>
			${messageText}
			<br>
			<div class="text-muted" style="float: right;">Created: ${datetime.toDateTimeString(message.created)}</div>
			<div class="text-muted" style="float: right;">Upated: ${datetime.toDateTimeString(message.timestamp)}</div>
			<div style="clear: both;"></div>`;
		}
		return item;
	}

	readMore(length, url) {
		const item = document.createElement('div');
		let text = '';

		if (length > 1) {
			text = $t('alert.text.furtherCases', { amount: length });
		} else {
			text = $t('alert.text.furtherCase', { amount: length });
		}

		if (this.loggedin) {
			item.className = 'alert-item text-center';
			item.innerHTML = `
			<a href="${url}" rel="noopener" target="_blank">
				${text}
			</a>`;
		} else {
			item.className = 'alert alert-info alert-card';
			item.innerHTML = `
			<a href="${url}" rel="noopener" target="_blank">
				${text}
			</a>`;
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
					messageArray.forEach((message, index) => {
						if (index < max) {
							$('.alert-button').find('.js-alert-content').append(this.buildMessage(message));
						}
					});
				}
			} else {
				$('.alert-section').empty();
				if (messageArray.length >= 1) {
					messageArray.forEach((message) => {
						if (message.status) {
							$('.alert-section').append(this.buildMessage(message));
						} else if (message.status === 'info') {
							// eslint-disable-next-line max-len
							$('.fa-exclamation-triangle').css('color', $('$colorInfo'));
						} else if (message.status === 'danger') {
							$('.fa-exclamation-triangle').css('color', $('$colorDanger'));
						}
					});
				}
			}

			const { length } = messageArray.filter((message) => message.status);
			if (messageArray.length) {
				if (this.loggedin) {
					$('.alert-button').find('.js-alert-content').append(
						this.readMore(messageArray.length - max, messageArray[max].url),
					);
				} else if (length !== 0 && length) {
					$('.alert-section').append(
						this.readMore(length - max, messageArray[max].url),
					);
				}
			}
		}
	}
}

export default AlertMessageController;
