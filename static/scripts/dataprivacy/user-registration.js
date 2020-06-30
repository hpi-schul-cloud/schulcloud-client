import './dataprivacy';
import './registration-link-validation';

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
		parentMailInput.setCustomValidity(
			'Für den Schüler muss eine andere Mailadresse als für die Eltern angegeben werden.',
		);
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

	$('input[readonly]').click(() => {
		/* eslint-disable-next-line max-len */
		$.showNotification(
			`Diese Daten hat deine Lehrkraft oder dein Administrator für dich eingetragen.
			Falls Anpassungen notwendig sind wende dich bitte an ihn/sie.
			Du kannst deine Daten auch nach abgeschlossenem Registrierungsprozess selbst ändern.`,
			'danger',
			false,
		);
	});
});
