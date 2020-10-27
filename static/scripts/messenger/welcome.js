const localStorageKey = 'welcomed-matrix';
const urlParam = 'hideMatrixWelcome';

$(document).ready(() => {
	const welcomeMatrixModal = $('.matrix-welcome-info');

	if (welcomeMatrixModal.length === 0) return;

	const urlParams = new URLSearchParams(window.location.search);

	if (localStorage.getItem(localStorageKey) !== 'true' && !urlParams.has(urlParam)) welcomeMatrixModal.modal('show');

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
		const checkboxValue = welcomeMatrixModal.find('.dontShowAgain-checkbox').prop('checked');
		localStorage.setItem(localStorageKey, checkboxValue);
		window.location = `/administration/school/?${urlParam}`;
		$('.matrix-welcome-info').modal('hide');
	});
});
