export default function validatePassword(passwordInput, passwordConfirmInput) {
	const minLength = 8;
	const hasUpperCase = /[A-Z]/.test(passwordInput.value);
	const hasLowerCase = /[a-z]/.test(passwordInput.value);
	const hasNumber = /[0-9]/.test(passwordInput.value);
	const hasSpecialChar = /[!§$%&()=?;:,.#+*~-]/.test(passwordInput.value);

	if (!hasLowerCase) {
		passwordInput.setCustomValidity($t('global.text.hasLowerCase'));
		passwordInput.reportValidity();
	} else if (!hasUpperCase) {
		passwordInput.setCustomValidity($t('global.text.hasUpperCase'));
		passwordInput.reportValidity();
	} else if (!hasNumber) {
		passwordInput.setCustomValidity($t('global.text.hasNumber'));
		passwordInput.reportValidity();
	} else if (!hasSpecialChar) {
		passwordInput.setCustomValidity($t('global.text.hasSpecialCharacter'));
		passwordInput.reportValidity();
	} else if (!passwordInput.length >= minLength) {
		passwordInput.setCustomValidity($t('global.text.hasMinLength'));
		passwordInput.reportValidity();
	} else if (passwordInput.value !== passwordConfirmInput.value) {
		passwordInput.setCustomValidity('');
		passwordConfirmInput.setCustomValidity($t('global.text.passwordsAreDifferent'));
		passwordConfirmInput.reportValidity();
	} else {
		passwordConfirmInput.setCustomValidity('');
	}
}
