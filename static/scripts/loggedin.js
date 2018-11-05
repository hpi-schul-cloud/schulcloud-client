/* global kjua jQuery introJs*/
import { setupFirebasePush } from './notificationService/indexFirebase';
import { sendShownCallback, sendReadCallback} from './notificationService/callback';

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
    var $contactHPIModal = $('.contactHPI-modal');
    var $featureModal = $('.feature-modal');
    var $contactAdminModal = $('.contactAdmin-modal');
    var $modalForm = $('.modal-form');

    function showAJAXError(req, textStatus, errorThrown) {
        $contactHPIModal.modal('hide');
        $contactAdminModal.modal('hide');
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

    const sendFeedback = function (modal, e) {
        e.preventDefault();

        let type = (modal[0].className.includes('contactHPI-modal')) ? 'contactHPI' : 'contactAdmin';

        let email = 'ticketsystem@schul-cloud.org';
        let subject = (type === 'contactHPI') ? 'Feedback' : 'Problem ' + modal.find('#title').val();
        
        $.ajax({
            url: '/helpdesk',
            type: 'POST',
            data: {
                type: type,
                subject: subject,
                category: modal.find('#category').val(),
                role: modal.find('#role').val(),
                desire: modal.find('#desire').val(),
                benefit: modal.find("#benefit").val(),
                acceptanceCriteria: modal.find("#acceptance_criteria").val(),
                currentState: modal.find('#hasHappened').val(),
                targetState: modal.find('#supposedToHappen').val(),
                email: email,
                modalEmail: modal.find('#email').val(),
            },
            success: function (result) {
                showAJAXSuccess("Feedback erfolgreich versendet!", modal);
            },
            error: showAJAXError
        });

        $('.contactHPI-modal').find('.btn-submit').prop("disabled", true);
    };

    $('.submit-helpdesk').on('click', function (e) {
        e.preventDefault();

        $('.contactHPI-modal').find('.btn-submit').prop("disabled", false);
        var title = $(document).find("title").text();
        var area = title.slice(0, title.indexOf('- Schul-Cloud') === -1 ? title.length : title.indexOf('- Schul-Cloud'));
        populateModalForm($contactHPIModal, {
            title: 'Wunsch oder Problem senden',
            closeLabel: 'Abbrechen',
            submitLabel: 'Senden',
            fields: {
                feedbackType: "userstory"
            }
        });
        
        $contactHPIModal.find('.modal-form').on('submit', sendFeedback.bind(this, $contactHPIModal));
        $contactHPIModal.appendTo('body').modal('show');
        $contactHPIModal.find('#title-area').html(area);
    });

    $('.submit-problem').on('click', function (e) {
        e.preventDefault();

        $('.contactAdmin-modal').find('.btn-submit').prop("disabled", false);
        populateModalForm($contactAdminModal, {
            title: 'Admin deiner Schule kontaktieren',
            closeLabel: 'Abbrechen',
            submitLabel: 'Senden'
        });

        $contactAdminModal.find('.modal-form').on('submit', sendFeedback.bind(this, $contactAdminModal));
        $contactAdminModal.appendTo('body').modal('show');
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
}); 

document.getElementById("intro-loggedin").addEventListener("click", startIntro, false);