import { iFrameListen } from './helpers/iFrameResize';
import './cleanup'; // see login.js for loggedout users
import initAlerts from './alerts';

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

    $('.alert-button').toggle().css('visibility');
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

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });

    $('.notification-dropdown-toggle').on('click', function () {
        $(this).removeClass('recent');

        $('.notification-dropdown .notification-item.unread').each(function () {
            if ($(this).data('read') == true) return;
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
            title: $t('global.text.sureAboutDiscardingChanges'),
        });
        $cancelModal.appendTo('body').modal('show');
    });

    populateModalForm($featureModal, {
        title: $t('loggedin.text.newFeaturesAvailable'),
        closeLabel: $t('global.button.cancel')
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
			$.showNotification($t('loggedin.text.schoolInTransferPhaseContactAdmin'), 'warning');
		} else if ($('#schuljahrtransfer').val() === 'Administrator') {
			$.showNotification($t('loggedin.text.schoolInTransferPhaseStartNew'), 'warning');
		}
    }

    initAlerts('loggedin');
});

function showAJAXError(req, textStatus, errorThrown) {
    if (textStatus === "timeout") {
        $.showNotification($t('global.text.requestTimeout'), "warn", true);
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

$(() => {
	$('a[data-action="logout"]').on('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		const target = $(e.target).data('href');

		if (!target) return false;

		$.ajax({
			type: 'POST',
			url: target,
			beforeSend(xhr) {
				xhr.setRequestHeader('Csrf-Token', `${csrftoken}`);
			},
			success(data) {
				window.location.href = data.redirect;
			},
		});
	});
});
