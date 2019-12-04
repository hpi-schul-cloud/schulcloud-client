const moment = require('moment');

moment.locale('de'); // set the localization

function getIcon(status) {
	switch (status) {
		case 1:
			return '<i class="fa fa-exclamation-circle text-danger"></i>';
		case 2:
			return '<i class="fa fa-check-circle text-success"></i>';
		default:
			return '';
	}
}

export function loggedinMessageBuilder(message) {
	const date = moment(message.timestamp).fromNow();
	const icon = getIcon(message.status);

	const item = document.createElement('div');
	item.className = 'alert-item';
	item.innerHTML = `<div class="alert-date text-nowrap text-muted">${date}</div>
    <div class="alert-title">${icon} ${message.title}</div>
    ${message.text}`;
	return item;
}

export function loginMessageBuilder(message) {
	const date = moment(message.timestamp).format('DD.MM.YYYY HH:mm');
	const icon = getIcon(message.status);

	const item = document.createElement('div');
	item.className = 'alert alert-info alert-card';
	item.innerHTML = `<h6>${icon} ${message.title}</h6>
    <div class="text-muted" style="float: left;">${date}</div> </br> ${message.text}`;
	return item;
}
