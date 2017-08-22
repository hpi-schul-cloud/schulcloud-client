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

	$('.add-to-lesson').on('click', function (e) {
		e.preventDefault();
		var entry = $(this).attr('href');
		var query = $('.search-field');

		$.getJSON(entry, function (result) {

            var fields = result.content;//.data.attributes;
            fields.query = query.val();

            if(window.isInline) {
                window.opener.addResource({
                	url: fields.url,
                    title: fields.title,
					description: fields.description,
                    client: fields.providerName
				});
                window.close();
                return;
            }

			populateModalForm($editModal, {
				title: 'Material zu Thema hinzufügen',
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
