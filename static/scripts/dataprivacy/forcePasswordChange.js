import './pin';
import '../helpers/inputFromQuery';
import '../helpers/inputLinking';
import '../jquery/datetimepicker-easy';
import '../pwrecovery';

function CustomEventPolyfill() {
	if (typeof window.CustomEvent === 'function') return false;
	function CustomEvent(event, orgParams) {
		const params = orgParams || { bubbles: false, cancelable: false, detail: null };
		const evt = document.createEvent('CustomEvent');
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	}
	window.CustomEvent = CustomEvent;
	return true;
}
CustomEventPolyfill();

/* HELPER */

if (!NodeList.prototype.indexOf) {
	NodeList.prototype.indexOf = Array.prototype.indexOf;
}
if (!NodeList.prototype.filter) {
	NodeList.prototype.filter = Array.prototype.filter;
}
if (!NodeList.prototype.some) {
	NodeList.prototype.some = Array.prototype.some;
}

/* MULTIPAGE INPUT FORM */

function submitForm(event) {
	if (this.checkValidity()) {
		event.preventDefault();
		const formSubmitButton = document.querySelector('#nextSection');
		formSubmitButton.disabled = true;
		$.ajax({
			url: this.getAttribute('action'),
			method: this.getAttribute('method'),
			data: $(this).serialize(),
			context: this,
		}).done(() => {
			$.showNotification('Ihr Passwort wurde geändert.', 'success', true);
			window.location.href = '/dashboard';
		})
			.fail((response) => {
				if (response.responseText !== undefined) {
					$.showNotification(`Fehler: ${response.responseText}`, 'danger', true);
				} else {
					const errorMessage = 'Das Absenden des Formulars ist fehlgeschlagen. (unbekannter Fehler)';
					$.showNotification(errorMessage, 'danger', true);
				}
				formSubmitButton.disabled = false;
			});
	} else {
		$.showNotification('Formular ungültig, bitte füllen Sie alle Felder korrekt aus.', 'danger', 6000);
	}
}

window.addEventListener('DOMContentLoaded', () => {
	const form = document.querySelector('.form');
	form.addEventListener('submit', submitForm);
});
