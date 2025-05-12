$(document).ready(() => {
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

		const now = new Date();
		if (sessionTokenExpirationDate && now < sessionTokenExpirationDate) {
			$('#external-logout').addClass('disabled');
		} else {
			$('#external-logout').removeClass('disabled');
		}
	});
});
