export default function validatePassword(passwordInput, passwordConfirmInput) {
	const minLength = 8;
	const hasUpperCase = /[A-Z]/.test(passwordInput.value);
	const hasLowerCase = /[a-z]/.test(passwordInput.value);
	const hasNumber = /[0-9]/.test(passwordInput.value);
	const hasSpecialChar = /[!§$%&()=?;:,.#+*~-]/.test(passwordInput.value);

	if (!hasLowerCase) {
		passwordInput.setCustomValidity($t('global.text.hasLowerCase'));
	} else if (!hasUpperCase) {
		passwordInput.setCustomValidity($t('global.text.hasUpperCase'));
	} else if (!hasNumber) {
		passwordInput.setCustomValidity($t('global.text.hasNumber'));
	} else if (!hasSpecialChar) {
		passwordInput.setCustomValidity($t('global.text.hasSpecialCharacter'));
	} else if (passwordInput.value.length < minLength) {
		passwordInput.setCustomValidity($t('global.text.hasMinLength'));
	} else if (passwordInput.value !== passwordConfirmInput.value) {
		passwordInput.setCustomValidity('');
		passwordConfirmInput.setCustomValidity($t('global.text.passwordsAreDifferent'));
	} else {
		passwordConfirmInput.setCustomValidity('');
	}

	passwordInput.reportValidity();
	passwordConfirmInput.reportValidity();
}
