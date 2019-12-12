/* global kjua jQuery introJs*/
// import { setupFirebasePush } from './notificationService/indexFirebase';
import { sendShownCallback, sendReadCallback} from './notificationService/callback';
import { iFrameListen } from './helpers/iFrameResize';
import './cleanup'; // see login.js for loggedout users

iFrameListen();

if (window.opener && window.opener !== window) {
    window.isInline = true;
}

function toggleMobileNav() {
    document.querySelector('aside.nav-sidebar').classList.toggle('active');
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

function showAJAXSuccess(message, modal) {
    modal.modal('hide');
    $.showNotification(message, "success", true);
}

function initEnterTheCloud() {
	const buttons = document.querySelectorAll('.enterthecloud-btn');
	const modal = document.querySelector('.enterthecloud-modal');
	if (!buttons.length || !modal) {
		return false;
	}
	buttons.forEach((btn) => {
		$(btn).on('click', () => {
			$(modal).appendTo('body').modal('show');
		});
	});
	return true;
}

$(document).ready(() => {
	initEnterTheCloud();
});

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
    var $featureModal = $('.feature-modal');
    var $autoLoggoutAlertModal = $('.auto-loggout-alert-modal');

    // default remaining session time in min
    const rstDefault = $autoLoggoutAlertModal.find('.form-group').data('rstDefault') || 120;

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

// Auto Loggout
populateModalForm($autoLoggoutAlertModal, {
	title: 'Achtung',
});

const showAutoLogoutModal = function (text) {
    $autoLoggoutAlertModal.modal('show');
    $autoLoggoutAlertModal.find('.modal-header').remove();
    if(text === 'error') {
        $autoLoggoutAlertModal.find('.sloth-text').hide();
        $autoLoggoutAlertModal.find('.sloth-text-error').show();
    } else {
        $autoLoggoutAlertModal.find('.sloth-text').show();
        $autoLoggoutAlertModal.find('.sloth-text-error').hide();
    }
}

const maxTotalRetrys = 1;
var totalRetry = 0;
var retry = 0;

const decRst = function () {
	setTimeout(() => {
		if (rst != 0) {
			rst -= 1;
            $('.js-time').text(rst);
            // show auto loggout alert modal 60 mins before 
            // don't show modal on retrys or totalRetry =/= 0
			if (retry === 0 && totalRetry === 0 && rst <= 60) {
				showAutoLogoutModal();
			}
			decRst();
		}
	}, 1000 * 60);
};

// Sync rst with Server
const syncRst = function () {
	setInterval(() => {
		$.post('/ttl', (result => {
            const ttl = result.ttl;
			if (typeof ttl === 'number') {
				 rst = ttl / 60;
			} else {
                console.error('Could not get remaining session time');
            }
        }));
	}, 1000 * 60 * 5);
};

// extend session
const IStillLoveYou = async function () {
	$.post('/ttl', { resetTimer: 'true' }, () => {
        // on success
        totalRetry = 0;
        rst = rstDefault;
        $.showNotification('Sitztung erfolgreich verlängert!', "success", true);
	}).fail(() => {
        // retry 5 times before showing error
		if (retry < 4) {
            retry++;
            setTimeout(function(){
                IStillLoveYou();
            },1000+retry*2000);
		} else {
            retry = 0;
            if(totalRetry === maxTotalRetrys){
                $.showNotification('Deine Sitzung konnte nicht verlängert werden! Bitte speichere ggf. deine Arbeit und lade die Seite neu', "danger", false);
            } else {
                showAutoLogoutModal('error');
            }
            totalRetry += 1;
        }
	});
};

var rst = rstDefault; // remaining session time in min
decRst(); // dec. rst
syncRst(); // Sync rst with Server

$autoLoggoutAlertModal.find('.btn-incRst').on('click', (e) => {
	e.stopPropagation();
	e.preventDefault();
	$autoLoggoutAlertModal.modal('hide');
});

$autoLoggoutAlertModal.on("hidden.bs.modal", function () {
    IStillLoveYou();
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

	// check for LDAP Transfer Mode
	if ($('#schuljahrtransfer').length) {
		if ($('#schuljahrtransfer').val() === 'Lehrer') {
			$.showNotification(`Die Schule befindet sich in der Transferphase zum neuen Schuljahr.
			Es können keine Klassen und Nutzer angelegt werden.
			Bitte kontaktiere den Schul-Administrator!`, 'warning');
		} else if ($('#schuljahrtransfer').val() === 'Administrator') {
			$.showNotification(`Die Schule befindet sich in der Transferphase zum neuen Schuljahr.
			Es können keine Klassen und Nutzer angelegt werden.
			Bitte läute <a href="/administration/school/"> hier das neue Schuljahr ein!</a>`, 'warning');
		}
	}
});

function showAJAXError(req, textStatus, errorThrown) {
    if (textStatus === "timeout") {
        $.showNotification("Zeitüberschreitung der Anfrage", "warn", true);
    } else {
        $.showNotification(errorThrown, "danger", true);
    }
}

window.addEventListener('DOMContentLoaded', function() {
    if (!/^((?!chrome).)*safari/i.test(navigator.userAgent)) {
        // setupFirebasePush();
    }

    let feedbackSelector = document.querySelector('#feedbackType');
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
        };
    }
});

// loading animation
document.addEventListener("DOMContentLoaded", function (e) {
    document.querySelector("body").classList.add("loaded");
});
window.addEventListener("beforeunload", function (e) {
    document.querySelector("body").classList.remove("loaded");

});
window.addEventListener("pageshow", function (e) {
    document.querySelector("body").classList.add("loaded");

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
        skipLabel: "Überspringen",
        hidePrev: true, //hide previous button in the first step
        hideNext: true  //hide next button in the last step
    })
    .start()
    .oncomplete(changeNavBarPositionToFixed);
}

window.addEventListener('load', () => {
	const continueTuorial = localStorage.getItem('Tutorial');
	if (continueTuorial == 'true') {
		startIntro();
		localStorage.setItem('Tutorial', false);
	}
	document.getElementById('intro-loggedin').addEventListener('click', startIntro, false);
});

document.querySelectorAll('#main-content a').forEach((a) => {
    const href = a.getAttribute('href');
    if (a.querySelector('img, .fa') == null && href) {
        if (!(href.startsWith('https://schul-cloud.org') || href.startsWith('#') || href.startsWith('/') || href === '')) {
            if (!a.getAttribute('target')) {
                a.setAttribute('target', '_blank');
            }
            a.classList.add('externalLink');
        }
    }
});
