import './dataprivacy';
import './registration-link-validation';
import getCookie from '../helpers/cookieManager';

const USER_LANG_KEY = 'USER_LANG';

const parentMailInput = document.querySelector('input[name="parent_email"]');
const studentMailInput = document.querySelector('input[name="email"]');

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

$('#language').change(() => {
	const selectedLanguage = $('#language option:selected').val();
	if (selectedLanguage) {
		const currentURL = new URL(window.location.href);
		currentURL.searchParams.set('lng', selectedLanguage);
		document.cookie = `${USER_LANG_KEY}=${selectedLanguage}; path=/`;
		window.location.href = currentURL.toString();
		return false;
	}
	return true;
});
