import validateInputOnOpeningTag from './helpers/openingTagValidation';

$(document).ready(() => {
	const courseName = document.getElementsByName('name')[0];

	if (courseName) courseName.addEventListener('keyup', () => validateInputOnOpeningTag(courseName));

	const validateTeacher = () => {
		const selectedOptionsArray = $('#teacherId').val() || [];
		const input = $('.chosen-search-input')[0];

		if (selectedOptionsArray.length < 1) {
			input.setCustomValidity('Das Eingabefeld darf nicht leer sein.');
			$('#courseTeacherErr').css('visibility', 'visible');
			$('.chosen-search-input').css('box-shadow', 'none');
			$('#teacherId_chosen').css('box-shadow', '0 0 5px 1px #ff1134');
		} else {
			input.setCustomValidity('');
			$('#courseTeacherErr').css('visibility', 'hidden');
			$('#teacherId_chosen').css('box-shadow', 'none');
		}
	};

	$('#teacherId').on('change', () => {
		validateTeacher();
	});

	$('.btn-submit').on('click', (e) => {
		if ($('#teacherId').length) {
			e.stopPropagation();
			validateTeacher();
		}
	});
});
