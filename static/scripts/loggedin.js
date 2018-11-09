/* global kjua jQuery introJs*/
import { setupFirebasePush } from './notificationService/indexFirebase';
import { sendShownCallback, sendReadCallback} from './notificationService/callback';

var $contactHPIModal;
var $contactAdminModal;

if (window.opener && window.opener !== window) {
    window.isInline = true;
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

let fullscreen = false;

function fullscreenBtnClicked() {
    togglePresentationMode();
    fullscreen = !fullscreen;
    sessionStorage.setItem("fullscreen", JSON.stringify(fullscreen));
}

function sendFeedback(modal, e) {
    let fmodal = $(modal);
    e.preventDefault();

    let type = (fmodal[0].className.includes('contactHPI-modal')) ? 'contactHPI' : 'contactAdmin';

    let subject = (type === 'contactHPI') ? 'Feedback' : 'Problem ' + fmodal.find('#title').val();
   
    $.ajax({
        url: '/helpdesk',
        type: 'POST',
        data: {
            type: type,
                subject: subject,
                category: fmodal.find('#category').val(),
                role: fmodal.find('#role').val(),
                desire: fmodal.find('#desire').val(),
                benefit: fmodal.find("#benefit").val(),
                acceptanceCriteria: fmodal.find("#acceptance_criteria").val(),
                currentState: fmodal.find('#hasHappened').val(),
                targetState: fmodal.find('#supposedToHappen').val()
        },
        success: function (result) {
            showAJAXSuccess("Feedback erfolgreich versendet!", fmodal);
        },
        error: function (result) {
            showAJAXError({}, "Fehler beim senden des Feedbacks", result);
        }
    });
    $('.contactHPI-modal').find('.btn-submit').prop("disabled", true);
};

function showAJAXSuccess(message, modal) {
    modal.modal('hide');
    $.showNotification(message, "success", true);
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
    $contactHPIModal = document.querySelector('.contactHPI-modal');
    var $featureModal = $('.feature-modal');
    $contactAdminModal = document.querySelector('.contactAdmin-modal');

    $('.submit-contactHPI').on('click', function (e) {
        e.preventDefault();

        $('.contactHPI-modal').find('.btn-submit').prop("disabled", false);
        populateModalForm($($contactHPIModal), {
            title: 'Wunsch oder Problem senden',
            closeLabel: 'Abbrechen',
            submitLabel: 'Senden',
            fields: {
                feedbackType: "userstory"
            }
        });
        
        $($contactHPIModal).appendTo('body').modal('show');
    });
    $contactHPIModal.querySelector('.modal-form').addEventListener("submit", sendFeedback.bind(this, $contactHPIModal));

    $('.submit-contactAdmin').on('click', function (e) {
        e.preventDefault();

        $('.contactAdmin-modal').find('.btn-submit').prop("disabled", false);
        populateModalForm($($contactAdminModal), {
            title: 'Admin deiner Schule kontaktieren',
            closeLabel: 'Abbrechen',
            submitLabel: 'Senden'
        });

        $($contactAdminModal).appendTo('body').modal('show');
    });

    $contactAdminModal.querySelector('.modal-form').addEventListener("submit", sendFeedback.bind(this, $contactAdminModal));

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
            togglePresentationMode();
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
        $cancelModal.appendTo('body').modal('show');
    });

    populateModalForm($featureModal, {
        title: 'Neue Features sind verfügbar',
        closeLabel: 'Abbrechen'
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

function showAJAXError(req, textStatus, errorThrown) {
    $($contactHPIModal).modal('hide');
    $($contactAdminModal).modal('hide');
    if (textStatus === "timeout") {
        $.showNotification("Zeitüberschreitung der Anfrage", "warn", true);
    } else {
        $.showNotification(errorThrown, "danger", true);
    }
}

window.addEventListener('DOMContentLoaded', function() {
    if (!/^((?!chrome).)*safari/i.test(navigator.userAgent)) {
        setupFirebasePush();
    }

    let  feedbackSelector = document.querySelector('#feedbackType');
    if(feedbackSelector){
        feedbackSelector.onchange = function(){
            if(feedbackSelector.value === "problem"){
                document.getElementById("problemDiv").style.display = "block";
                document.getElementById("userstoryDiv").style.display = "none";
                document.querySelectorAll("#problemDiv input, #problemDiv textarea, #problemDiv select").forEach((node)=>{
                    node.required=true;
                });
                document.querySelectorAll("#userstoryDiv input, #userstoryDiv textarea, #userstoryDiv select").forEach((node)=>{
                    node.required=false;
                });
            } else {
                document.getElementById("problemDiv").style.display = "none";
                document.getElementById("userstoryDiv").style.display = "block";
                document.querySelectorAll("#problemDiv input, #problemDiv textarea, #problemDiv select").forEach((node)=>{
                    node.required=false;
                });
                document.querySelectorAll("#userstoryDiv input, #userstoryDiv textarea, #userstoryDiv select").forEach((node)=>{
                    node.required=true;
                });
                document.getElementById("acceptance_criteria").required = false;
            }
        }
    }
});
window.addEventListener("resize", function () {
    $('.sidebar-list').css({"height": window.innerHeight});
});

function changeNavBarPositionToAbsolute() {
    var navBar = document.querySelector('.nav-sidebar');
    navBar.classList.add("position-absolute");
}

function changeNavBarPositionToFixed() {
    var navBar = document.querySelector('.nav-sidebar');
    navBar.classList.remove("position-absolute");
}

function startIntro() {
    changeNavBarPositionToAbsolute();
    introJs()
    .setOptions({
        nextLabel: "Weiter",
        prevLabel: "Zurück",
        doneLabel: "Fertig",
        skipLabel: "Überspringen"
    })
    .start()
    .oncomplete(changeNavBarPositionToFixed);
}

window.addEventListener("load", () => {
    var continueTuorial=localStorage.getItem('Tutorial');
    if(continueTuorial=='true') {
        startIntro();
        localStorage.setItem('Tutorial', false);
    }
    if ('serviceWorker' in navigator) {
        // enable sw for half of users only
        let testUserGroup = parseInt(document.getElementById('testUserGroup').value);
        if(testUserGroup == 1) {
            navigator.serviceWorker.register('/sw.js');
        }
    }
    document.getElementById("intro-loggedin").addEventListener("click", startIntro, false);
});