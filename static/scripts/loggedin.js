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

    $('.submit-helpdesk').on('click', function (e) {
        e.preventDefault();

        var title = $(document).find("title").text();
        populateModalForm($feedbackModal, {
            title: 'Feedback - Bereich: ' + title.slice(0, title.indexOf('- Schul-Cloud') === -1 ? title.length : title.indexOf('- Schul-Cloud')),
            closeLabel: 'Schließen',
            submitLabel: 'Senden'
        });

        $feedbackModal.find('.modal-form').on('submit', sendFeedback.bind(this, modal));
        $feedbackModal.modal('show');
    });

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });
});