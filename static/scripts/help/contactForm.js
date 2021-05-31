function initForm(formContainer) {
	const teamForm = formContainer.querySelector('.team_form');
	const wishForm = teamForm.querySelector('.wish_form');
	const bugForm = teamForm.querySelector('.bug_form');


	// handle form change when type changes
	formContainer.querySelector('#message_type').addEventListener('change', (event) => {
		const value = event.target.value || event.target.querySelector('[name=message_type]:checked').value;
		if (value === 'wish') {
			wishForm.classList.remove('hidden');
			bugForm.classList.add('hidden');
		} else {
			wishForm.classList.add('hidden');
			bugForm.classList.remove('hidden');
		}
	});
}

function init() {
	document.querySelectorAll('.contact-form').forEach(initForm);
}


if (!window.contactForm) {
	window.contactForm = init;
	window.addEventListener('load', window.contactForm);
}

// accessability radio buttons (keyboard navigation)
document.querySelectorAll('label').forEach((label) => {
	if (!label.getAttribute('for')) { return; }
	const input = document.getElementById(label.getAttribute('for'));
	if (!input || input.getAttribute('type') !== 'radio') { return; }
	const fieldset = input.closest('fieldset');

	label.addEventListener('keydown', (event) => {
		if (input.getAttribute('disabled') !== null || input.getAttribute('readonly') !== null) {
			return true;
		}
		// other than spacebar and enter see: https://webaim.org/techniques/keyboard/
		if (event.keyCode !== 32 && event.keyCode !== 13) {
			return true;
		}
		// check input
		event.preventDefault();
		event.stopPropagation();
		input.checked = true;

		// trigger change event
		if (fieldset) {
			const newEvent = new CustomEvent('change', { target: fieldset });
			fieldset.dispatchEvent(newEvent);
		}
		return false;
	}, false);
});
