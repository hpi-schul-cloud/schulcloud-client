$(document).ready(() => {
	const $modals = $('.modal');
	const $editModal = $('.edit-modal');
	let customFieldCount = 0;

	function guidGenerator() {
		const S4 = function () {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return (`${S4() + S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`);
	}

	const deleteCustomField = function (customFieldId) {
		$(`#${customFieldId}`).remove();
	};

	const addNewCustomField = function (modal) {
		const $customFields = modal.find('.custom-fields');
		const $newCustomFieldKey = modal.find('.new-custom-field-key');
		const $newCustomFieldValue = modal.find('.new-custom-field-value');
		populateCustomField($customFields, {
			key: $newCustomFieldKey.val(),
			value: $newCustomFieldValue.val(),
		});
		$newCustomFieldKey.val('');
		$newCustomFieldValue.val('');
	};

	var populateCustomField = function ($customFields, field) {
		if (!field.key || field.key == '') return;

		const _id = guidGenerator();
		const $field = $(`<div id='${_id}'>Key: ${field.key}, Value: ${field.value}</div>`)
			.append($(`<input name='customs[${customFieldCount}][key]' value='${field.key}' type='hidden'></input>`))
			.append($(`<input name='customs[${customFieldCount}][value]' value='${field.value}' type='hidden'></input>`))
			.append($("<i class='fa fa-trash-o custom-field-delete' />")
				.click(deleteCustomField.bind(this, _id)));
		$customFields.append($field);
		customFieldCount++;
	};

	const populateCustomFields = function (modal, customFields) {
		const $customFields = modal.find('.custom-fields');

		// cleanup
		$customFields.empty();

		customFields.forEach((field) => {
			populateCustomField($customFields, field);
		});
		modal.find('.new-custom-field-add').click(addNewCustomField.bind(this, modal));
	};

	/**
     * posts a (non-lti) local tool to the server
     * @param modal {Modal} - the modal which has the post-action and the courseId
     * @param tool {object} - the tool which will be created
     */
	const createLocalTool = function (modal, tool) {
		const $modalForm = modal.find('.modal-form');
		const href = $modalForm.attr('action');
		const courseId = $modalForm.find("input[name='courseId']").val();
		// cleaning
		tool.isTemplate = false;
		tool.courseId = courseId;
		tool.originTool = tool._id;
		delete tool.oAuthClientId;
		delete tool.useIframePseudonym;
		delete tool._id;
		$.ajax({
			action: href,
			data: tool,
			method: 'POST',
			success(result) {
				window.location.href = `/courses/${courseId}`;
			},
		});
	};

	/** var populateCourseSelection = function (modal, courses) {
        var $selection = modal.find('.course-selection');
        courses.forEach(function (course) {
            var option = document.createElement("option");
            option.text = course.name;
            option.value = course._id;
            $selection.append(option);
        });
        $selection.chosen().trigger("chosen:updated");
    };* */

	$('.template_tool').on('click', function (e) {
		e.preventDefault();
		const entry = $(this).attr('href');
		$.getJSON(entry, (result) => {
			if (result.tool.isLocal) {
				createLocalTool($editModal, result.tool);
			} else {
				populateModalForm($editModal, {
					closeLabel: 'Abbrechen',
					submitLabel: 'Speichern',
					fields: result.tool,
				});
				populateCustomFields($editModal, result.tool.customs);
				$editModal.appendTo('body').modal('show');
			}
		});
	});

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});
});
