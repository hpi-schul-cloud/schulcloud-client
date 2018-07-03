if (window.opener && window.opener !== window) {
    window.isInline = true;
}

const diffDOM = new diffDOM();

function softNavigate(newurl, selector = 'html', listener, callback) {
    $.ajax({
        type: "GET",
        url: newurl
    }).done(function (r) {
        // render new page
        parser = new DOMParser()
        const newPage = parser.parseFromString(r, "text/html");
        // apply new page
        try {
            const newPagePart = newPage.querySelector(selector);
            const oldPagePart = document.querySelector(selector);
            const diff = diffDOM.diff(oldPagePart, newPagePart);
            const result = diffDOM.apply(oldPagePart, diff);
            document.querySelectorAll((listener || selector) + " a").forEach(link => {
                linkClone = link.cloneNode(true);
                linkClone.addEventListener("click", function (e) {
                    softNavigate($(this).attr('href'), selector, listener);
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                })
                link.parentNode.replaceChild(linkClone, link);
            })
            // scroll to top
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
            jQuery(document).trigger('pageload');
            if (callback) {
                callback();
            }
        } catch (e) {
            console.error(e);
            $.showNotification("Fehler bei AJAX-Navigation", "danger", true);
        }
    });
}

function toggleMobileNav() {
    document.querySelector('aside.nav-sidebar nav:first-child').classList.toggle('active');
    this.classList.toggle('active');
}

function toggleMobileSearch() {
    document.querySelector('.search-wrapper .input-group').classList.toggle('active');
    document.querySelector('.search-wrapper .mobile-search-toggle .fa').classList.toggle('fa-search');
    document.querySelector('.search-wrapper .mobile-search-toggle .fa').classList.toggle('fa-times');
}

function togglePresentationMode() {
    const contentArea = $('#main-content');
    const toggleButton = $('.btn-fullscreen');
    $('body').toggleClass('fullscreen');
    toggleButton.children('i').toggleClass('fa-compress');
    toggleButton.children('i').toggleClass('fa-expand');
}

var fullscreen = false;

function fullscreenBtnClicked() {
    togglePresentationMode();
    fullscreen = !fullscreen;
    sessionStorage.setItem("fullscreen", JSON.stringify(fullscreen));
}

$(document).ready(function () {
    // Init mobile nav
    var mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    var mobileSearchToggle = document.querySelector('.mobile-search-toggle');
    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', toggleMobileNav);
    }
    if (mobileSearchToggle) {
        mobileSearchToggle.addEventListener('click', toggleMobileSearch);
    }

    // Init modals
    var $modals = $('.modal');
    var $feedbackModal = $('.feedback-modal');
    var $featureModal = $('.feature-modal');
    var $problemModal = $('.problem-modal');
    var $modalForm = $('.modal-form');

    function showAJAXError(req, textStatus, errorThrown) {
        $feedbackModal.modal('hide');
        $problemModal.modal('hide');
        if (textStatus === "timeout") {
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
    const createFeedbackMessage = function (modal) {
        return "Als " + modal.find('#role').val() + "\n" +
            "möchte ich " + modal.find('#desire').val() + ",\n" +
            "um " + modal.find("#benefit").val() + ".\n" +
            "Akzeptanzkriterien: " + modal.find("#acceptance_criteria").val();
    };

    const sendFeedback = function (modal, e) {
        e.preventDefault();

        let type = (modal[0].className.includes('feedback-modal')) ? 'feedback' : 'problem';

        let email = 'ticketsystem@schul-cloud.org';
        let subject = (type === 'feedback') ? 'Feedback' : 'Problem ' + modal.find('#title').val();
        let text = createFeedbackMessage(modal);
        let content = {text: text};
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
            success: function (result) {
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
        $feedbackModal.appendTo('body').modal('show');
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
        $problemModal.appendTo('body').modal('show');
    });

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });

    $('.notification-dropdown-toggle').on('click', function () {
        $(this).removeClass('recent');

        $('.notification-dropdown .notification-item.unread').each(function () {
            if ($(this).data('read') == true) return;

            sendShownCallback({notificationId: $(this).data('notification-id')});
            sendReadCallback($(this).data('notification-id'));
            $(this).data('read', true);
        });
    });

    $('.btn-create-qr').on('click', function () {
        // create qr code for current page
        let image = kjua({text: window.location.href, render: 'image'});
        let $qrbox = $('.qr-show');
        $qrbox.empty();
        $qrbox.append(image);
    });
  
    // Init mobile nav
    if (document.getElementById('searchBar') instanceof Object) {
        document.querySelector('.mobile-nav-toggle').addEventListener('click', toggleMobileNav);
        document.querySelector('.mobile-search-toggle').addEventListener('click', toggleMobileSearch);
    }

    if (!fullscreen) {
        fullscreen = JSON.parse(sessionStorage.getItem("fullscreen")) || false;
        if (fullscreen) {
            togglePresentationMode()
        }
    }
    if(document.querySelector('.btn-fullscreen')){
        document.querySelector('.btn-fullscreen').addEventListener('click', fullscreenBtnClicked);
    }

    $('.btn-cancel').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        let $cancelModal = $('.cancel-modal');
        populateModalForm($cancelModal, {
            title: 'Bist du dir sicher, dass du die Änderungen verwerfen möchtest?',
        });
        let $modalForm = $cancelModal.find(".modal-form");
        $cancelModal.appendTo('body').modal('show');
    });

    populateModalForm($featureModal, {
        title: 'Neue Features sind verfügbar',
        closeLabel: 'Abbrechen'
    });
  
    // loading animation
    window.addEventListener("beforeunload", function (e) {
        const loaderClassList = document.querySelector(".preload-screen").classList;
        loaderClassList.remove("hidden");
    });
    window.addEventListener("pageshow", function (e) {
        const loaderClassList = document.querySelector(".preload-screen").classList;
        loaderClassList.add("hidden");
    });

    // from: https://stackoverflow.com/a/187557
    jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function (arg) {
        return function (elem) {
            return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
    });
    // js course search/filter
    $("input.js-search").on("keyup", e => {
        if (e.key === "Escape") $(e.target).val("");
        if (e.key === "Unidentified") {
            return false;
        }
        $(".sc-card-title").find('.title:not(:Contains("' + $(e.target).val() + '"))').parents(".sc-card-wrapper").fadeOut(400);
        $(".sc-card-title").find('.title:Contains("' + $(e.target).val() + '")').parents(".sc-card-wrapper").fadeIn(400);

        return !(e.key === "Unidentified");
    });
});
