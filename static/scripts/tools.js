$(document).ready(function () {

    var $modals = $('.modal');
    var $editModal = $('.edit-modal');
    var $deepLinkingModal = $('.deep-linking-modal');
    var customFieldCount = 0;

	function guidGenerator() {
		const S4 = function guid() {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); // eslint-disable-line no-bitwise
		};
		return (`${S4() + S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`);
	}

	const deleteCustomField = function deleteCustomField(customFieldId) {
		$(`#${customFieldId}`).remove();
	};

	const populateCustomField = function populateCustomField($customFields, field) {
		if (!field.key || field.key === '') return;

    var populateCustomField = function ($customFields, field) {
        if (!field.key || field.key == '') return;

        var _id = guidGenerator();
        var $field = $("<div id='" + _id + "'>Key: " + field.key + ", Value: " + field.value + "</div>")
            .append($("<input name='customs[" + customFieldCount + "][key]' value='" + field.key + "' type='hidden'></input>"))
            .append($("<input name='customs[" + customFieldCount + "][value]' value='" + field.value + "' type='hidden'></input>"))
            .append($("<i class='fa fa-trash-o custom-field-delete' />")
                .click(deleteCustomField.bind(this, _id))
            );
        $customFields.append($field);
        customFieldCount++;
    };

	const addNewCustomField = function addNewCustomField(modal) {
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

	const populateCustomFields = function populateCustomFields(modal, customFields) {
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
	  const createLocalTool = function createLocalTool(modal, tool) {
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

	$('.template_tool').on('click', function addTool(e) {
		e.preventDefault();
		const entry = $(this).attr('href');
		$.getJSON(entry, (result) => {
			const tool = result.tool[0];
			if (tool.isLocal) {
				createLocalTool($editModal, tool);
			} else {
				populateModalForm($editModal, {
					closeLabel: 'Abbrechen',
					submitLabel: 'Speichern',
					fields: tool,
				});
				populateCustomFields($editModal, tool.customs);
				$editModal.appendTo('body').modal('show');
			}
		});
	});

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});
});
