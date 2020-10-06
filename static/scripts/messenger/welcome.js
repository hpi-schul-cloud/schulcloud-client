const localStorageKey = 'welcomed-matrix';

$(document).ready(() => {
	const welcomeMatrixModal = $('.matrix-welcome-info');

	if (welcomeMatrixModal.length === 0) return;

	if (localStorage.getItem(localStorageKey) !== 'true') welcomeMatrixModal.modal('show');

	welcomeMatrixModal.find('.dont-show-again').on('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		const checkboxValue = welcomeMatrixModal.find('.dontShowAgain-checkbox').prop('checked');
		localStorage.setItem(localStorageKey, checkboxValue);
		welcomeMatrixModal.modal('hide');
	});

	welcomeMatrixModal.find('.matrix-settings').on('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		localStorage.setItem(localStorageKey, 'true');
		window.location = '/administration/school';
		$('.matrix-welcome-info').modal('hide');
	});
});
