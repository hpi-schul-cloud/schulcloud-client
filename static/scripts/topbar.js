import { broadcast, notifyLogout, subsscribeToLogoutBroadcast } from './helpers/sessionBroadcast';

$(document).ready(() => {
	subsscribeToLogoutBroadcast();
	const $externalLogoutBtn = $('#external-logout');

	function disableExternalLogoutBtn() {
		$externalLogoutBtn
			.addClass('disabled')
			.attr('tabindex', '-1')
			.attr('aria-disabled', 'true');
	}

	function enableExternalLogoutBtn() {
		$externalLogoutBtn
			.removeClass('disabled')
			.removeAttr('tabindex')
			.removeAttr('aria-disabled');
	}

	let sessionTokenExpirationDate;

	if ($externalLogoutBtn.length > 0) {
		const route = '/api/v3/oauth/session-token/expiration';
		$.getJSON(route)
			.done((response) => {
				sessionTokenExpirationDate = new Date(response.expiresAt);
			});
	}

	$('#logout').click(() => {
		notifyLogout();
		broadcast.close();
	});

	$('.user-menu-btn').click(() => {
		const isMenuClosing = $('.user-menu').hasClass('open');
		if (isMenuClosing) {
			return;
		}

		if (!sessionTokenExpirationDate) {
			disableExternalLogoutBtn();
			return;
		}

		const now = new Date();
		if (now >= sessionTokenExpirationDate) {
			disableExternalLogoutBtn();
		} else {
			enableExternalLogoutBtn();
		}
	});
});
