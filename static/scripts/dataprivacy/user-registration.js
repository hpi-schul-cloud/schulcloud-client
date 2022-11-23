import getCookie from '../helpers/cookieManager';
import './dataprivacy';
import './registration-link-validation';

const USER_LANG_KEY = 'USER_LANG';

const parentMailInput = document.querySelector('input[name="parent_email"]');
const studentMailInput = document.querySelector('input[name="email"]');
const passwordInput = document.querySelector('input[id="password"]');
const passwordConfirmInput = document.querySelector('input[id="password-control"]');

function validateDifferentEmails() {
	if (
		parentMailInput.value
		&& studentMailInput.value
		&& parentMailInput.value === studentMailInput.value
	) {
		parentMailInput.setCustomValidity($t('dataprivacy.text.differentEmailParentStudent'));
		$(parentMailInput)
			.closest('section')
			.addClass('show-invalid');
	} else {
		parentMailInput.setCustomValidity('');
	}
	parentMailInput.reportValidity();
}

function validatePassword() {
	if (passwordInput.value !== passwordConfirmInput.value) {
		passwordConfirmInput.setCustomValidity($t('global.text.passwordsAreDifferent'));
		passwordConfirmInput.reportValidity();
	} else {
		passwordConfirmInput.setCustomValidity('');
	}
}

function goBack(event) {
	event.stopPropagation();
	event.preventDefault();
	window.history.back();
}

window.addEventListener('DOMContentLoaded', () => {
	if (parentMailInput && studentMailInput) {
		'change input keyup paste'.split(' ').forEach((event) => {
			parentMailInput.addEventListener(event, validateDifferentEmails, false);
			studentMailInput.addEventListener(event, validateDifferentEmails, false);
		});
	}

	if (passwordInput) passwordInput.onchange = validatePassword;
	if (passwordConfirmInput) passwordConfirmInput.onkeyup = validatePassword;

	const firstSection = document.querySelector(
		'.form section[data-panel="section-1"]:not(.noback)',
	);
	if (firstSection) {
		firstSection.addEventListener('showSection', () => {
			const backButton = document.getElementById('prevSection');
			backButton.addEventListener('click', goBack);
			backButton.removeAttribute('disabled');
		});
		firstSection.addEventListener('hideSection', () => {
			const backButton = document.getElementById('prevSection');
			backButton.removeEventListener('click', goBack);
		});
	}

	const selectedLanguage = getCookie(USER_LANG_KEY);
	if ($('form.registration-form [name="language"]').length === 0) {
		$('form.registration-form')
			.append(`<input type="hidden" aria-hidden="true" name="language" value="${selectedLanguage}">`);
	}

	$('input[readonly]').click(() => {
		/* eslint-disable-next-line max-len */
		$.showNotification(
			$t('dataprivacy.text.dataGivenByTeacherOrAdmin'),
			'danger',
			false,
		);
	});
});
