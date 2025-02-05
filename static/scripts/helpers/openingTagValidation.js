function containsOpeningTagFollowedByString(input) {
	const regex = /<\S+(?<!<)/;
	const result = regex.test(input);

	return result;
};

export default function validateInputOnOpeningTag(input) {
	// Firefox needs blur event to trigger validation
	input.blur();
	input.focus();

	if (containsOpeningTagFollowedByString(input.value)) {
		input.setCustomValidity($t('global.text.containsOpeningTag'));
	} else {
		input.setCustomValidity('');
	}

	input.reportValidity();
};
