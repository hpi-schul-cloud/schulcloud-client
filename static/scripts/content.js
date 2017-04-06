$(document).ready(function () {
	var $modals = $('.modal');
	var $editModal = $('.edit-modal');

	var populateCourseSelection = function (modal, courses) {
		var $selection = modal.find('.course-selection');
		courses.forEach(function (course) {
			var option = document.createElement("option");
			option.text = course.name;
			option.value = course._id;
			$selection.append(option);
		});
		$selection.chosen().trigger("chosen:updated");
	};

	var populateLessonSelection = function (modal, lessons) {
		var $selection = modal.find('.lesson-selection');
		$selection
			.find('option')
			.remove()
			.end();

		lessons.forEach(function (lesson) {
			var option = document.createElement("option");
			option.text = lesson.name;
			option.value = lesson._id;
			$selection.append(option);
		});

		modal.find('.lessons').css("display", "block");
		$selection.chosen().trigger("chosen:updated");
	};

	var populateModalForm = function (modal, data) {

		var $title = modal.find('.modal-title');
		var $btnSubmit = modal.find('.btn-submit');
		var $btnClose = modal.find('.btn-close');
		var $form = modal.find('.modal-form');

		$title.html(data.title);
		$btnSubmit.html(data.submitLabel);
		$btnClose.html(data.closeLabel);

		// fields
		$('[name]', $form).not('[data-force-value]').each(function () {
			var value = (data.fields || {})[$(this).prop('name').replace('[]', '')] || '';
			switch ($(this).prop("type")) {
				case "radio":
				case "checkbox":
					$(this).each(function () {
						if ($(this).attr('value') == value) $(this).attr("checked", value);
					});
					break;
				default:
					$(this).val(value).trigger("chosen:updated");
			}
		});
	};


	$('.add-to-lesson').on('click', function (e) {
		e.preventDefault();
		var entry = $(this).attr('href');
		var query = $('.search-field');
		$.getJSON(entry, function (result) {
			var fields = result.content.data.attributes;
			fields.query = query.val();

			populateModalForm($editModal, {
				title: 'Material zu Stunde hinzufügen',
				closeLabel: 'Schließen',
				submitLabel: 'Senden',
				fields: fields
			});
			populateCourseSelection($editModal, result.courses.data);
			$editModal.modal('show');
		});
	});

	$('.course-selection').on('change', function () {
		var selectedCourse = $(this).find("option:selected").val();
		$.getJSON('/courses/' + selectedCourse + '/json', function (res) {
			populateLessonSelection($editModal, res.lessons.data);
		});
	});

	$modals.find('.close, .btn-close').on('click', function () {
		$modals.modal('hide');
	});
});