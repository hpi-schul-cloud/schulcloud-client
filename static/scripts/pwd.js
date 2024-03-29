$(document).ready(() => {
	$('.show_hide_password button').on('click', (event) => {
		event.preventDefault();
		const element = ($(event.target).is(':parent')) ? $(event.target).find('span') : $(event.target);
		const passwordId = $($(event.target).parents('div')[1]).find('input').attr('id');

		if ($(`#${passwordId}`).attr('type') === 'text') {
			document.querySelectorAll(`#${passwordId}`).forEach((ele) =>{
				ele.setAttribute('type', 'password');
			});
			$(element).addClass('fa-eye-slash');
			$(element).removeClass('fa-eye');
		} else if ($(`#${passwordId}`).attr('type') === 'password') {
			document.querySelectorAll(`#${passwordId}`).forEach((ele) =>{
				ele.setAttribute('type', 'text');
			});
			$(element).removeClass('fa-eye-slash');
			$(element).addClass('fa-eye');
		}
	});
});
