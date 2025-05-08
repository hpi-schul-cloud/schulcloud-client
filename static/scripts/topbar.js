$(document).ready(() => {
	$('.user-menu-btn').click(() => {
		getSessionTokenExpiration();
	});

	function getSessionTokenExpiration() {
		const route = '/api/v3/oauth/session-token/expiration';

		$.getJSON(route)
			.done((response) => {
				const isSessionTokenExpired = new Date() >= new Date(response.expiresAt);
				if (isSessionTokenExpired) {
					$('[data-testid=external-logout]').addClass("disabled");
				} else {
					$('[data-testid=external-logout]').removeClass("disabled");
				}
			})
			.fail((response) => {
				if (response.responseJSON && response.responseJSON.error) {
					const err = response.responseJSON.error;
					console.error(err.toString());
				}
			});
	}
});
