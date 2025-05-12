$(document).ready(() => {
	let sessionTokenExpiration;

	const route = '/api/v3/oauth/session-token/expiration';
	$.getJSON(route)
		.done((response) => {
			sessionTokenExpiration = new Date() >= new Date(response.expiresAt);
		});

	$('.user-menu-btn').click(() => {
		const isMenuClosing = $('.user-menu').hasClass('open');
		if (isMenuClosing) {
			return;
		}

		const now = new Date();
		if (sessionTokenExpiration && now >= new Date(sessionTokenExpiration)) {
			$('#external-logout').addClass('disabled');
		} else {
			$('#external-logout').removeClass('disabled');
		}
	});
});
