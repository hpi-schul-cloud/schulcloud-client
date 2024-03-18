import moment from 'moment';

const datetime = require('../datetime/datetime');
const uk = require('../../../locales/calendar/uk.json');
const es = require('../../../locales/calendar/es.json');

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

		const getLangAttribute = () => document.querySelector('html').getAttribute('lang');
		moment.locale(getLangAttribute(), this.selectMomentOptions(getLangAttribute()));
		const item = document.createElement('div');
		if (this.loggedin) {
			item.className = 'alert-item';
			item.innerHTML = `
			<div class="alert-title">${icon} ${message.title}</div>
			${message.text}
			<br>
			<div class="alert-date text-nowrap text-muted" style="float: left;">
			 	${$t('alert.text.updatedAt')} ${datetime.fromNow(message.timestamp)} <span>|</span>
			</div>
			<div class="alert-date text-nowrap text-muted" style="float: left; margin-left: 5px;">
				${$t('alert.text.createdAt')} ${datetime.toDateTimeString(message.createdAt)}
			</div>
			<div style="clear: both;"></div>`;
		} else {
			item.className = 'alert alert-info alert-card';
			item.innerHTML = `<h6 style="overflow: hidden; text-overflow: ellipsis;">${icon} ${message.title}</h6>
			${message.text}
			<br>
			<div class="text-muted" style="float: left;">
				${$t('alert.text.updatedAt')}
				${datetime.toDateTimeString(message.timestamp)} <span>|</span>
			</div>
			<div class="text-muted" style="float: left; margin-left: 5px;">
				${$t('alert.text.createdAt')} ${datetime.toDateTimeString(message.createdAt)}
			</div>
			<div style="clear: both;"></div>`;
		}
		return item;
	}

	createCustomRelativeTimeConfig = (localFile) => ({
		d: `${localFile['moment.relativeTime.aDay']}`,
		dd: `%d ${localFile['moment.relativeTime.days']}`,
		future: `${localFile['moment.relativeTime.futureIn']} %s`,
		h: `${localFile['moment.relativeTime.anHour']}`,
		hh: `%d ${localFile['moment.relativeTime.hours']}`,
		m: `${localFile['moment.relativeTime.aMinute']}`,
		M: `${localFile['moment.relativeTime.aMonths']}`,
		mm: `%d ${localFile['moment.relativeTime.minutes']}`,
		MM: `%d ${localFile['moment.relativeTime.months']}`,
		past: `%s ${localFile['moment.relativeTime.pastAgo']}`,
		s: `${localFile['moment.relativeTime.aFewSecondes']}`,
		ss: `%d ${localFile['moment.relativeTime.seconds']}`,
		w: `${localFile['moment.relativeTime.aWeek']}`,
		ww: `%d ${localFile['moment.relativeTime.weeks']}`,
		y: `${localFile['moment.relativeTime.aYear']}`,
	});

	selectMomentOptions = (langAttribute) => {
		const options = {};
		if (langAttribute === 'uk') {
			options.relativeTime = this.createCustomRelativeTimeConfig(uk);
		}
		if (langAttribute === 'es') {
			options.relativeTime = this.createCustomRelativeTimeConfig(es);
		}
		return options;
	};

	showAlert(messageArray) {
		if (!messageArray || messageArray.length === 0) {
			// If messageArray is empty, we do not show the triangle
			localStorage.setItem('SC-Alerts', JSON.stringify([]));
			if (this.loggedin) {
				$('.alert-button').css('visibility', 'hidden');
			}
			return;
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
