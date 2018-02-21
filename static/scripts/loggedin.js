if (window.opener && window.opener !== window) {
    document.body.classList.add('window-inline');
    window.isInline = true;
}

$(document).ready(function () {
    var $modals = $('.modal');
    var $feedbackModal = $('.feedback-modal');
    var $featureModal = $('.feature-modal');
    var $problemModal = $('.problem-modal');
    var $modalForm = $('.modal-form');

    function showAJAXError(req, textStatus, errorThrown) {
        $feedbackModal.modal('hide');
        $problemModal.modal('hide');
        if(textStatus==="timeout") {
            $.showNotification("Zeitüberschreitung der Anfrage", "warn", true);
        } else {
            $.showNotification(errorThrown, "danger", true);
        }
    }

    function showAJAXSuccess(message, modal) {
        modal.modal('hide');
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

        let type = (modal[0].className.includes('feedback-modal')) ? 'feedback' : 'problem';

        let email = 'schul-cloud-support@hpi.de';
        let subject = (type === 'feedback') ? 'Feedback' : 'Problem ' + modal.find('#title').val();
        let text = createFeedbackMessage(modal);
        let content = { text: text};
        let category = modal.find('#category').val();
        let currentState = modal.find('#hasHappened').val();
        let targetState = modal.find('#supposedToHappen').val();

        $.ajax({
            url: '/helpdesk',
            type: 'POST',
            data: {
                email: email,
                modalEmail: modal.find('#email').val(),
                subject: subject,
                content: content,
                type: type,
                category: category,
                currentState: currentState,
                targetState: targetState
            },
            success: function(result) {
                showAJAXSuccess("Feedback erfolgreich versendet!", modal)
            },
            error: showAJAXError
        });

        $('.feedback-modal').find('.btn-submit').prop("disabled", true);
    };

    $('.submit-helpdesk').on('click', function (e) {
        e.preventDefault();

        $('.feedback-modal').find('.btn-submit').prop("disabled", false);
        var title = $(document).find("title").text();
        var area = title.slice(0, title.indexOf('- Schul-Cloud') === -1 ? title.length : title.indexOf('- Schul-Cloud'));
        populateModalForm($feedbackModal, {
            title: 'User Story eingeben',
            closeLabel: 'Abbrechen',
            submitLabel: 'Senden'
        });

        $feedbackModal.find('.modal-form').on('submit', sendFeedback.bind(this, $feedbackModal));
        $feedbackModal.modal('show');
        $feedbackModal.find('#title-area').html(area);
    });

    $('.submit-problem').on('click', function (e) {
        e.preventDefault();

        $('.problem-modal').find('.btn-submit').prop("disabled", false);
        populateModalForm($problemModal, {
            title: 'Problem melden',
            closeLabel: 'Abbrechen',
            submitLabel: 'Senden'
        });

        $problemModal.find('.modal-form').on('submit', sendFeedback.bind(this, $problemModal));
        $problemModal.modal('show');
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

    $('.btn-create-qr').on('click', function () {
        // create qr code for current page
        let el = kjua({text: window.location.href, render: 'canvas'});
        let $qrbox = $('.qr-show');
        $qrbox.empty();
        $qrbox.append(el);
    });

    var fullscreen = JSON.parse(sessionStorage.getItem("fullscreen"))||false;
    function togglePresentationMode(){
        const contentArea = $('#main-content');
        const toggleButton = $('.btn-fullscreen');
        $('body').toggleClass('fullscreen');
        toggleButton.children('i').toggleClass('fa-compress');
        toggleButton.children('i').toggleClass('fa-expand');
    }
    if(fullscreen){togglePresentationMode()}
    $('.btn-fullscreen').on('click', function(){
        togglePresentationMode();
        fullscreen = !fullscreen;
        sessionStorage.setItem("fullscreen", JSON.stringify(fullscreen));
    });

    $('.btn-cancel').on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        let $cancelModal = $('.cancel-modal');
        populateModalForm($cancelModal, {
            title: 'Bist du dir sicher, dass du die Änderungen verwerfen möchtest?',
        });
        let $modalForm = $cancelModal.find(".modal-form");
        $cancelModal.modal('show');
    });

    $.ajax({
        url: '/help/releases',
        type: 'GET',
        success: function(release) {
            let cookies = getCookiesMap(document.cookie);
            populateModalForm($featureModal, {
                title: 'Neue Features sind verfügbar',
                closeLabel: 'Abbrechen'
            });
            if (cookies['releaseDate']) {
                if (release.createdAt > cookies['releaseDate']) {
                    document.cookie = "releaseDate=" + release.createdAt + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
                    $featureModal.modal('show');
                }
            } else {
                document.cookie = "releaseDate=" + release.createdAt + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
                $featureModal.modal('show');
            }
        },
        error: function(err) {
            console.log(err);
        }
    });
});
