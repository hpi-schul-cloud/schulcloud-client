$(document).ready(() => {
	$('.show_hide_password button').on('click', (event) => {
		event.preventDefault();
		if ($('.show_hide_password input').attr('type') == 'text') {
			$('.show_hide_password input').attr('type', 'password');
			$('.show_hide_password i').addClass('fa-eye-slash');
			$('.show_hide_password i').removeClass('fa-eye');
		} else if ($('.show_hide_password input').attr('type') == 'password') {
			$('.show_hide_password input').attr('type', 'text');
			$('.show_hide_password i').removeClass('fa-eye-slash');
			$('.show_hide_password i').addClass('fa-eye');
		}
	});

	$('.show_hide_password_account button').on('click', (event) => {
		event.preventDefault();
		const element = ($(event.target).is(':parent')) ? $(event.target).find('span') : $(event.target);
		const passwordId = $($(event.target).parents('div')[1]).find('input').attr('id');

		if ($(`#${passwordId}`).attr('type') === 'text') {
			document.querySelectorAll(`#${passwordId}`)[0].setAttribute('type', 'password');
			$(element).addClass('fa-eye-slash');
			$(element).removeClass('fa-eye');
		} else if ($(`#${passwordId}`).attr('type') === 'password') {
			document.querySelectorAll(`#${passwordId}`)[0].setAttribute('type', 'text');
			$(element).removeClass('fa-eye-slash');
			$(element).addClass('fa-eye');
		}
	});
});
