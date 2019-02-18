$(document).ready(() => {
	console.log('event bla');
	$('.section-teamInvitations a').click(function handler(e) {
		e.stopPropagation();
		e.preventDefault();

		const id = $(this).parents('.sc-card-wrapper').data('id');
		console.log(id, $(this).parents('.sc-card-wrapper'));

		$.ajax({
			url: `/teams/invitation/accept/${id}`,
			method: 'GET',
		}).done(() => {
			$.showNotification('Einladung erfolgreich angenommen', 'success', true);
			location.reload();
		}).fail(() => {
			$.showNotification('Problem beim Akzeptieren der Einladung', 'danger', true);
		});
	});
});
