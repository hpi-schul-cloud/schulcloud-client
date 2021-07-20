$(document).ready(() => {
	$('.show_hide_password button').on('click', (event) => {
		event.preventDefault();
		const element = ($(event.target).is(':parent')) ? $(event.target).find('span') : $(event.target);
		const passwordId = $($(event.target).parents('div')[1]).find('input').attr('id');

		if ($(`#${passwordId}`).attr('type') === 'text') {
			$(`#${passwordId}`).attr('type', 'password');
			$(element).addClass('fa-eye-slash');
			$(element).removeClass('fa-eye');
		} else if ($(`#${passwordId}`).attr('type') === 'password') {
			$(`#${passwordId}`).attr('type', 'text');
			$(element).removeClass('fa-eye-slash');
			$(element).addClass('fa-eye');
		}
	});
});
