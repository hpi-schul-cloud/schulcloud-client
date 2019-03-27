/* eslint-disable no-undef */
function t(toast) {
	if (!iziToast) {
		// eslint-disable-next-line no-console
		return console.error('iziToast missing to display toasts!');
	}

	iziToast.settings({
		position: 'topRight',
		theme: 'light',
	});

	if (toast === 'notificationsDisabled') {
		return iziToast.error({
			icon: 'fa fa-envelope',
			title: 'Push-Benachrichtigungen sind blockiert!',
			message: 'Klicke zum Aktivieren auf das Icon links neben der Adresszeite und erlaube Benachrichtigungen.',
			timeout: false,
		});
	}
	if (toast === 'notificationsettingsUpdated') {
		return iziToast.show({
			icon: 'fa fa-check',
			title: 'Deine Benachrichtigungseinstellungen wurden gespeichert',
		});
	}
	if (toast === 'notificationsettingsUpdatedError') {
		return iziToast.error({
			icon: 'fa fa-exclamation-triangle',
			title: 'Deine Benachrichtigungseinstellungen konnten nicht gespeichert werden',
			message: 'Aktualisiere diese Seite und versuche es erneut.',
		});
	}

	if (toast === 'notificationsEnabled') {
		return iziToast.info({
			icon: 'fa fa-envelope',
			title: 'Push-Benachrichtigungen wurden erfolgreich aktiviert',
			message: 'Neuigkeiten können jetzt auf deinem Gerät angezeigt werden.',
		});
	}
	if (toast === 'notificationRegistrationError') {
		return iziToast.error({
			icon: 'fa fa-envelope',
			title: 'Push-Benachrichtigungen konnten nicht aktiviert werden',
			message: 'Beim Aktivieren ist ein interner Fehler aufgetreten.',
		});
	}
	if (toast === 'pushTokenUpdateError') {
		return iziToast.error({
			icon: 'fa fa-envelope',
			title: 'Push-Benachrichtigungen müssen erneut aktiviert werden',
			message: 'Beim Erneuern der Aktivierung ist ein Fehler aufgetreten.',
		});
	}
	if (toast === 'pushDisabled') {
		return iziToast.show({
			icon: 'fa fa-envelope',
			title: 'Push-Benachrichtigungen wurden deaktiviert.',
		});
	}
	if (toast === 'errorDisablePush') {
		return iziToast.error({
			icon: 'fa fa-envelope',
			title: 'Push-Benachrichtigungen konnten nicht deaktiviert werden.',
		});
	}
	if (toast === 'successfullySendPushTestMessage') {
		return iziToast.show({
			icon: 'fa fa-envelope',
			title: 'Eine Test-Push-Benachrichtigung wurde versendet.',
		});
	}
	if (toast === 'errorSendPushTestMessage') {
		return iziToast.error({
			icon: 'fa fa-envelope',
			title: 'Eine Test-Push-Benachrichtigung konnte nicht versendet werden.',
			message: 'Dies ist ein Serverfehler.',
		});
	}
	if (toast === 'errorMarkNotificationAsSeen') {
		return iziToast.error({
			icon: 'fa fa-envelope',
			title: 'Die Benachrichtigung konnte nicht als gelesen markiert werden.',
		});
	}

	// default
	return iziToast.show({
		title: toast,
	});
}

module.exports = t;
