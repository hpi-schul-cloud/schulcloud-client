function createDeepLink(event) {

}

$(document).ready(function () {

    var $modals = $('.modal');
    var $editModal = $('.edit-modal');
    var $deepLinkingModal = $('.deep-linking-modal');
    var customFieldCount = 0;

    function guidGenerator() {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }

    var deleteCustomField = function (customFieldId) {
        $('#' + customFieldId).remove();
    };

    var addNewCustomField = function (modal) {
        var $customFields = modal.find('.custom-fields');
        var $newCustomFieldKey = modal.find('.new-custom-field-key');
        var $newCustomFieldValue = modal.find('.new-custom-field-value');
        populateCustomField($customFields, {
            key: $newCustomFieldKey.val(),
            value: $newCustomFieldValue.val()
        });
        $newCustomFieldKey.val("");
        $newCustomFieldValue.val("");
    };

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

    var populateCustomFields = function (modal, customFields) {
        var $customFields = modal.find('.custom-fields');

        // cleanup
        $customFields.empty();

        customFields.forEach(function (field) {
            populateCustomField($customFields, field);
        });
        modal.find('.new-custom-field-add').click(addNewCustomField.bind(this, modal));
    };

    /**
     * posts a (non-lti) local tool to the server
     * @param modal {Modal} - the modal which has the post-action and the courseId
     * @param tool {object} - the tool which will be created
     */
    var createLocalTool = function (modal, tool) {
        var $modalForm = modal.find('.modal-form');
        var href = $modalForm.attr('action');
        var courseId = $modalForm.find("input[name='courseId']").val();
        // cleaning
        tool.isTemplate = false;
        tool.courseId = courseId;
        delete tool._id;

        $.ajax({
            action: href,
            data: tool,
            method: 'POST',
            success: function(result) {
                window.location.href = "/courses/" + courseId;
            }
        });
    };

    /**var populateCourseSelection = function (modal, courses) {
        var $selection = modal.find('.course-selection');
        courses.forEach(function (course) {
            var option = document.createElement("option");
            option.text = course.name;
            option.value = course._id;
            $selection.append(option);
        });
        $selection.chosen().trigger("chosen:updated");
    };**/

    $('.template_tool').on('click', function (e) {
        e.preventDefault();
        var entry = $(this).attr('href');
        $.getJSON(entry, function (result) {
            if (result.tool.isLocal) {
                createLocalTool($editModal, result.tool);
            } else {
            	if (result.tool.lti_message_type === 'LtiDeepLinkingRequest') {
					populateModalForm($deepLinkingModal, {
						title: 'Bitte im Tool den einzufügenden Inhalt auswählen:',
						closeLabel: 'Abbrechen',
						submitLabel: 'Speichern'
					});
					const courseId = $editModal.find('.modal-form').find("input[name='courseId']").val();
					window.addEventListener("message", createDeepLink, false);
					$deepLinkingModal.find('.modal-body').append(`<iframe src="/courses/${courseId}/tools/run/${result.tool._id}" />`);
					$deepLinkingModal.appendTo('body').modal('show');
				} else {
					populateModalForm($editModal, {
						closeLabel: 'Abbrechen',
						submitLabel: 'Speichern',
						fields: result.tool
					});
					populateCustomFields($editModal, result.tool.customs);
					$editModal.appendTo('body').modal('show');
				}
            }
        });
    });

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });

});
