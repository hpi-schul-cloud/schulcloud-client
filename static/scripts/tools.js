$(document).ready(() => {
	const $modals = $('.modal');
	const $editModal = $('.edit-modal');
	const $deepLinkingModal = $('.deep-linking-modal');
	let customFieldCount = 0;

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

		const _id = guidGenerator();
		const $field = $(`<div id='${_id}'>Key: ${field.key}, Value: ${field.value}</div>`)
			.append($(`<input name='customs["${customFieldCount}"][key]' value='${field.key}' type='hidden'>
			</input>`))
			.append($(`<input name='customs["${customFieldCount}"][value]' value='${field.value}' type='hidden'>
			</input>`))
			.append($('<i class="fa fa-trash-o custom-field-delete" />')
				.click(deleteCustomField.bind(this, _id)));
		$customFields.append($field);
		customFieldCount += 1;
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
		delete tool.oAuthClientId;
		delete tool._id;
		$.ajax({
			action: href,
			data: tool,
			method: 'POST',
		}).done(() => {
			window.location.href = `/courses/${courseId}?activeTab=tools`;
		}).fail(() => {
			$.showNotification($t('courses._course.tools.add.text.errorWhileAddingTool'), 'danger');
		});
	};

	$('.template_tool').on('click', function addTool(e) {
		e.preventDefault();
		const entry = $(this).attr('href');
		$.getJSON(entry, (result) => {
			const tool = result.tool[0];
			tool.originTool = tool._id;
			if (tool.isLocal) {
				if (tool.name === 'Video-Konferenz mit BigBlueButton') {
					const $addBbbToolModal = $('.add-bbb-modal');

					populateModalForm($addBbbToolModal, {
						title: $t('courses._course.tools.add.headline.videoConference'),
						closeLabel: $t('global.button.cancel'),
						submitLabel: $t('global.button.add'),
					});
					$addBbbToolModal.appendTo('body').modal('show');
					$addBbbToolModal.off('submit').on('submit', (event) => {
						event.preventDefault();
						createLocalTool($editModal, tool);
					});
					return;
				}
				createLocalTool($editModal, tool);
			} else if (tool.lti_message_type === 'LtiDeepLinkingRequest') {
				tool.lti_message_type = 'LtiResourceLinkRequest';
				populateModalForm($deepLinkingModal, {
					title: 'Bitte im Tool den einzufügenden Inhalt auswählen:',
					closeLabel: 'Abbrechen',
					submitLabel: 'Speichern',
					fields: tool,
				});
				const courseId = $editModal.find('.modal-form').find("input[name='courseId']").val();
				$deepLinkingModal
					.find('.modal-body')
					.append(`<iframe src="/courses/${courseId}/tools/run/${tool._id}" />`);
				$deepLinkingModal.appendTo('body').modal('show');
			} else {
				populateModalForm($editModal, {
					closeLabel: $t('global.button.cancel'),
					submitLabel: $t('global.button.save'),
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

	// Safari 3.0+ "[object HTMLElementConstructor]"
	const remoteNotification = (p) => (p.toString() === '[object SafariRemoteNotification]');
	const isSafari = /constructor/i.test(window.HTMLElement)
		|| remoteNotification(!window.safari || (typeof safari !== 'undefined' && safari.pushNotification));
	if (isSafari) {
		$('#safari-workaround').show();
	}
});
