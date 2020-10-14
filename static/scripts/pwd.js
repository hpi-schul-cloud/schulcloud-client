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
});
