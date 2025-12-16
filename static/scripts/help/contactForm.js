const errorMessages = {
	// TODO: add more specific error messages as needed
	INTERNAL_ERROR: 'global.text.internalProblem',
};

function showSuccessMessage(message) {
	$.showNotification($t(message), 'success', 5000);
}

function showErrorMessage(message) {
	$.showNotification($t(message), 'danger', 5000);
}

function showAJAXError(err) {
	// TODO: handle specific error messages from server
	// if (err.responseJSON) {
	// 	const { message } = err.responseJSON;
	// 	showErrorMessage(errorMessages[message] || errorMessages.INTERNAL_ERROR);
	// }
	showErrorMessage('helpdesk.text.feedbackError');
}

const reloadPage = (msg, timeout = 2000) => {
	window.localStorage.setItem('afterSendHelpdeskForm', 'true');
	setTimeout(() => {
		window.location.reload();
	}, timeout);
};

// handle form submissions via AJAX
function handleFormSubmit(form) {
	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		const formData = new FormData(form);
		const { action } = form.dataset;
		const actionUrl = `/api/v3/helpdesk/${action}`;

		$.ajax({
			data: formData,
			url: actionUrl,
			type: 'POST',
			processData: false,
			contentType: false,
			success: () => reloadPage('helpdesk.text.feedbackSuccessful', 0),
			error: showAJAXError,
		});
	});
}

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

	// AJAX-Handler für beide Forms aktivieren
	handleFormSubmit(wishForm);
	handleFormSubmit(bugForm);
}

function afterSendHelpdeskForm() {
	if (window.localStorage?.getItem('afterSendHelpdeskForm')) {
		showSuccessMessage('helpdesk.text.feedbackSuccessful');
		window.localStorage.removeItem('afterSendHelpdeskForm');
	}
}

$(document).ready(() => {
	afterSendHelpdeskForm();
});

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
