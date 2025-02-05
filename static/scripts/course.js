import validateInputOnOpeningTag from './helpers/openingTagValidation';

$(document).ready(() => {
	const courseName = document.getElementsByName('name')[0];

	if (courseName) courseName.addEventListener('keyup', () => validateInputOnOpeningTag(courseName));
});
