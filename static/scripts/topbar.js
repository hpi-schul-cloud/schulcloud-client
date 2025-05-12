$(document).ready(() => {
	$('.user-menu-btn').click(() => {
		const isMenuClosing = $('.user-menu').hasClass('open');
		if (isMenuClosing) {
			return;
		}

		const route = '/api/v3/oauth/session-token/expiration';
		if ($('#external-logout').length > 0) {
			$.getJSON(route)
				.done((response) => {
					const isSessionTokenExpired = new Date() >= new Date(response.expiresAt);
					if (isSessionTokenExpired) {
						$('#external-logout').addClass('disabled');
					} else {
						$('#external-logout').removeClass('disabled');
					}
				})
				.fail(() => {
					$('#external-logout').addClass('disabled');
				});
		}
	});
});
