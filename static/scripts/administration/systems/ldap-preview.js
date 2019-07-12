window.addEventListener('DOMContentLoaded', () => {
	// Checkbox Schoolyear
	document.querySelector('#startldapschoolyear').addEventListener('change', (status) => {
		if (status.currentTarget.checked) {
			document.querySelector('#buttonstartldapschoolyear').classList.remove('disabled');
		} else {
			document.querySelector('#buttonstartldapschoolyear').classList.add('disabled');
		}
	});
});
