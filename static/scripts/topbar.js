$(document).ready(() => {
	$('.user-menu-btn').click(() => {
		const route = '/api/v3/oauth/session-token/expiration';

		if ($('[data-testid=external-logout]').length > 0) {
			$.getJSON(route)
				.done((response) => {
					const isSessionTokenExpired = new Date() >= new Date(response.expiresAt);
					if (isSessionTokenExpired) {
						$('[data-testid=external-logout]').addClass('disabled');
					} else {
						$('[data-testid=external-logout]').removeClass('disabled');
					}
				})
				.fail(() => {
					$('[data-testid=external-logout]').addClass('disabled');
				});
		}
	});
});
