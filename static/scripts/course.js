import containsOpeningTagFollowedByString from './helpers/containsOpeningTag';

$(document).ready(() => {
	const validateCourseName = (courseName) => {
	// Firefox needs blur event to trigger validation
		courseName.blur();
		courseName.focus();

		if (containsOpeningTagFollowedByString(courseName.value)) {
			courseName.setCustomValidity($t('global.text.containsOpeningTag'));
		} else {
			courseName.setCustomValidity('');
		}

		courseName.reportValidity();
	};

	const courseName = document.getElementsByName('name')[0];

	if (courseName) courseName.addEventListener('keyup', () => validateCourseName(courseName));
});
