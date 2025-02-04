export function validatePassword(passwordInput) {
	// Firefox needs blur event to trigger validation
	passwordInput.blur();
	passwordInput.focus();

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
	} else {
		passwordInput.setCustomValidity('');
	}

	passwordInput.reportValidity();
}

export function validateConfirmationPassword(passwordInput, passwordConfirmInput) {
	// Firefox needs blur event to trigger validation
	passwordConfirmInput.blur();
	passwordConfirmInput.focus();

	if (passwordInput.value !== passwordConfirmInput.value) {
		passwordConfirmInput.setCustomValidity($t('global.text.passwordsAreDifferent'));
	} else {
		passwordConfirmInput.setCustomValidity('');
	}

	passwordConfirmInput.reportValidity();
}
