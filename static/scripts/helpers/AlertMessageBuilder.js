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

export function MessageBuilder(message, loggedin) {
	const date = moment(message.timestamp);
	const icon = getIconTag(message.status);

	const item = document.createElement('div');
	if (loggedin) {
		item.className = 'alert-item';
		item.innerHTML = `<div class="alert-date text-nowrap text-muted">${date.fromNow()}</div>
		<div class="alert-title">${icon} ${message.title}</div>
		${message.text}`;
	} else {
		item.className = 'alert alert-info alert-card';
		item.innerHTML = `<h6>${icon} ${message.title}</h6>
		<div class="text-muted" style="float: left;">${date.format('DD.MM.YYYY HH:mm')}</div> </br> ${message.text}`;
	}
	return item;
}
