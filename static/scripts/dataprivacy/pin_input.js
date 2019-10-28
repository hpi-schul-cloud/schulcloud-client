if (!NodeList.prototype.forEach) {
	NodeList.prototype.forEach = Array.prototype.forEach;
}

function buildPin(wrapper) {
	let pin = '';
	wrapper.querySelectorAll('.digit').forEach((input) => {
		pin += input.value;
	});
	return pin;
}
function handleInput() {
	this.checkValidity();
	if (this.value.length === 1) {
		this.parentElement.querySelector('input.combined-pin').value = buildPin(this.parentElement);
		if (this.nextElementSibling) {
			this.nextElementSibling.focus();
		}
	}
}
function initializePin() {
	document.querySelectorAll('.pin-input').forEach((pinInput) => {
		pinInput.querySelectorAll('.digit').forEach((digit) => {
			digit.addEventListener('input', handleInput);
		});
	});
}
window.addEventListener('DOMContentLoaded', initializePin);
