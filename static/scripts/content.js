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
		$.getJSON(entry, function (result) {
			populateModalForm($editModal, {
				title: 'Material zu Stunde hinzufügen',
				closeLabel: 'Schließen',
				submitLabel: 'Senden',
				fields: result.content
			});
			populateCourseSelection($editModal, result.courses.data);
			$editModal.modal('show');
		});
	});

	$('.course-selection').on('change', function () {
		console.log($(this).find("option-selected").val());
	});

	$modals.find('.close, .btn-close').on('click', function () {
		$modals.modal('hide');
	});
});