import '../helpers/inputLinking';

window.addEventListener('DOMContentLoaded', () => {
	// show first login for existing users without age
	const birthdateInput = document.querySelector('input[name="student-age"]');
	const showLoginButton = document.querySelector('#showExistingLoginForm');
	const radio1415 = document.getElementById('reg-1415');
	const radio16 = document.getElementById('reg-16');


	if (birthdateInput && showLoginButton) {
		$('#showExistingLoginForm').on('click', () => {
			const baseUrl = '/firstLogin';
			if (radio1415.checked) {
				window.location.href = `${baseUrl}?ue14=true`;
			} else if (radio16.checked) {
				window.location.href = `${baseUrl}?ue16=true`;
			} else {
				window.location.href = `${baseUrl}?u14=true`;
			}
		});
		$("#welcome-screen input[type='radio']").on('change', () => {
			if (radio1415.checked) {
				showLoginButton.disabled = false;
			} else if (radio16.checked) {
				showLoginButton.disabled = false;
			} else {
				showLoginButton.disabled = false;
			}
		});
	}
});
