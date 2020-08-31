import './dataprivacy';
import './registration-link-validation';
import { getCookie } from '../helpers/cookieHelper';

const USER_LANG_KEY = 'USER_LANG';

function validateDifferent() {
	const parentMailInput = document.querySelector(
		'input[name="parent-email"]',
	);
	const studentMailInput = document.querySelector(
		'input[name="student-email"]',
	);
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
}
function goBack(event) {
	event.stopPropagation();
	event.preventDefault();
	window.history.back();
}

window.addEventListener('DOMContentLoaded', () => {
	const parentMailInput = document.querySelector(
		'input[name="parent-email"]',
	);
	const studentMailInput = document.querySelector(
		'input[name="student-email"]',
	);
	if (parentMailInput && studentMailInput) {
		'change input keyup paste'.split(' ').forEach((event) => {
			parentMailInput.addEventListener(event, validateDifferent, false);
			studentMailInput.addEventListener(event, validateDifferent, false);
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
	if ($('form.registration-form input[name="defaultLanguage"]').length === 0) {
		$('form.registration-form')
			.append(`<input type="hidden" name="defaultLanguage" value="${selectedLanguage}">`);
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

$('#defaultLanguage').change(() => {
	const selectedLanguage = $('#defaultLanguage option:selected').val();
	if (selectedLanguage) {
		document.cookie = `${USER_LANG_KEY}=${selectedLanguage}; path=/`;
		window.location.reload();
		return false;
	}
	return true;
});
