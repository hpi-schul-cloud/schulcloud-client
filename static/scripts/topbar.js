$(document).ready(() => {
	function disableExternalLogoutBtn() {
		$('#external-logout')
			.addClass('disabled')
			.attr('tabindex', '-1')
			.attr('aria-disabled', 'true');
	}

	function enableExternalLogoutBtn() {
		$('#external-logout')
			.removeClass('disabled')
			.removeAttr('tabindex')
			.removeAttr('aria-disabled');
	}

	let sessionTokenExpirationDate;

	const route = '/api/v3/oauth/session-token/expiration';
	$.getJSON(route)
		.done((response) => {
			sessionTokenExpirationDate = new Date(response.expiresAt);
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
