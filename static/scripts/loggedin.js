$(document).ready(function () {
    var $modals = $('.modal');
    var $feedbackModal = $('.feedback-modal');
    var $modalForm = $('.modal-form');

    function showAJAXError(req, textStatus, errorThrown) {
        $feedbackModal.modal('hide');
        if(textStatus==="timeout") {
            $.showNotification("Zeitüberschreitung der Anfrage", "warn", true);
        } else {
            $.showNotification(errorThrown, "danger", true);
        }
    }

    function showAJAXSuccess(message) {
        $feedbackModal.modal('hide');
        $.showNotification(message, "success", true);
    }

    /**
     * creates the feedback-message which will be sent to the Schul-Cloud helpdesk
     * @param modal {object} - modal containing content from feedback-form
     */
    const createFeedbackMessage = function(modal) {
        return "Als " + modal.find('#role').val() + "\n" +
                "möchte ich " + modal.find('#desire').val() + ",\n" +
                "um " + modal.find("#benefit").val() + ".\n" +
                "Akzeptanzkriterien: " + modal.find("#acceptance_criteria").val();
    };

    const sendFeedback = function (modal, e) {
        e.preventDefault();

        var email= 'schul-cloud-support@hpi.de';
        var subject = 'Feedback';
        var content = { text: createFeedbackMessage(modal)};

        $.ajax({
            url: '/helpdesk',
            type: 'POST',
            data: {
                email: email,
                modalEmail: modal.find('#email').val(),
                subject: subject,
                content: content
            },
            success: function(result) {
                showAJAXSuccess("Feedback erfolgreich versendet!")
            },
            error: showAJAXError
        });

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

        $form.on('submit', sendFeedback.bind(this, modal));
    };

    $('.submit-helpdesk').on('click', function (e) {
        e.preventDefault();

        var title = $(document).find("title").text();
        populateModalForm($feedbackModal, {
            title: 'Feedback - Bereich: ' + title.slice(0, title.indexOf('- Schul-Cloud') === -1 ? title.length : title.indexOf('- Schul-Cloud')),
            closeLabel: 'Schließen',
            submitLabel: 'Senden'
        });
        $feedbackModal.modal('show');
    });

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });

    $('.notification-dropdown-toggle').on('click', function () {
        $(this).removeClass('recent');

        $('.notification-dropdown .notification-item.unread').each(function() {
            if($(this).data('read') == true) return;

            sendShownCallback({notificationId: $(this).data('notification-id')});
            sendReadCallback($(this).data('notification-id'));
            $(this).data('read', true);
        });
    });
});