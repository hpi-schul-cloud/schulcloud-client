window.addEventListener('DOMContentLoaded', () => {
	const form = document.querySelector('.registration-form');
	const submitButton = form.querySelector('input[type="submit"]');

	form.addEventListener('submit', () => {
		submitButton.disabled = true;
	});
});
