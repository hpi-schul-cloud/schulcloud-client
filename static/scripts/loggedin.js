import { iFrameListen } from './helpers/iFrameResize';
import initAlerts from './alerts';

iFrameListen();

if (window.opener && window.opener !== window) {
    window.isInline = true;
}

function showHideElement(element) {
	if (element.style.display === 'none') {
		element.style.display = 'block';
	} else {
		element.style.display = 'none';
	}
}

function showHideGlobalAnnouncement() {
	const announcementAlert = document.querySelector('.alert-announcement');
	if (announcementAlert) {
		showHideElement(announcementAlert);
	}
}

// new sidebar
function toggleSidebarItemGroup(groupData) {
    const itemGroup = document.querySelector(`.${groupData.groupName}`);
	if (itemGroup) {
		if (itemGroup.classList.contains('show-subgroup')) {
            if (groupData.childActive) return;

            itemGroup.classList.remove('show-subgroup');
            itemGroup.classList.add('hide-subgroup');
        } else {
            itemGroup.classList.add('show-subgroup');
            itemGroup.classList.remove('hide-subgroup');
        }
	}

    const toggleIcon = document.querySelector(`#${groupData.groupName}-toggle-icon`);
    if (toggleIcon) {
		if (toggleIcon.classList.contains('mdi-chevron-down')) {
            toggleIcon.classList.remove('mdi-chevron-down');
            toggleIcon.classList.add('mdi-chevron-up');
        } else {
            toggleIcon.classList.remove('mdi-chevron-up');
            toggleIcon.classList.add('mdi-chevron-down');
        }
	}
}

function adjustContentWidth(sidebar) {
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
        if (sidebar.classList.contains('hidden')) {
            contentWrapper.style.paddingLeft = '0px';
        } else {
            contentWrapper.style.paddingLeft = '255px';
        }
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    const contentDiv = document.querySelector('.content-min-height');

	if (sidebar) {
		if (sidebar.classList.contains('hidden')) {
            sidebar.classList.remove('hidden');
            sidebar.classList.add('visible');

            if (window.innerWidth <= 1279) {
                overlay.style.display = "block";
                overlay.style.position = "fixed";
                contentDiv.style.position = "fixed";
                sidebar.style.height = "100%";
            }
        } else {
            sidebar.classList.remove('visible');
            sidebar.classList.add('hidden');

            if (window.innerWidth <= 1279) {
                overlay.style.display = "none";
                overlay.style.position = "absolute";
                contentDiv.style.position = "static";
                sidebar.style.height = "unset";
            }
        }

        if (window.innerWidth <= 1279) return;
        adjustContentWidth(sidebar);
	}

    const toggleInTopbar = document.querySelector('.sidebar-toggle-in-topbar');
    const toggleInSidebar = document.querySelector('.sidebar-toggle-in-sidebar');
    if (toggleInTopbar && toggleInSidebar) {
		if (toggleInTopbar.classList.contains('invisible-toggle')) {
            toggleInTopbar.classList.remove('invisible-toggle');
            toggleInSidebar.classList.add('invisible-toggle');
        } else if (toggleInSidebar.classList.contains('invisible-toggle')) {
            toggleInSidebar.classList.remove('invisible-toggle');
            toggleInTopbar.classList.add('invisible-toggle');
        }
	}
}

function toggleSidebarOnWindowWidth(sidebar) {
    const overlay = document.querySelector('.overlay');

    if (overlay) {
        if (window.innerWidth <= 1279) {
            sidebar.classList.remove('visible');
            sidebar.classList.add('hidden');
        }
        if (window.innerWidth >= 1280) {
            sidebar.classList.remove('hidden');
            sidebar.classList.add('visible');
            overlay.style.display = "none";
        }
        if (sidebar.classList.contains('hidden')) {
            overlay.style.display = "none";
        }
        adjustContentWidth(sidebar);
    }
}

let priorWidth = window.innerWidth;
window.addEventListener('resize', () => {
    const sidebar = document.querySelector('.sidebar');
    const currentWidth = window.innerWidth;

    if (window.innerWidth <= 1279 && sidebar.classList.contains('visible') && priorWidth <= currentWidth) {
        return;
    }
    if (currentWidth >= 1280 && sidebar.classList.contains('hidden') && priorWidth >= currentWidth) {
        return;
    }
    toggleSidebarOnWindowWidth(sidebar);
    priorWidth = currentWidth;
});

function toggleMobileNav() {
    document.querySelector('aside.nav-sidebar').classList.toggle('active');
	showHideGlobalAnnouncement();
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
    toggleButton.children('i').toggleClass('mdi-arrow-collapse');
    toggleButton.children('i').toggleClass('mdi-arrow-expand');

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
    // new sidebar
    const groupToggleBtns = document.querySelectorAll('.group-toggle-btn');
    if (groupToggleBtns) {
        groupToggleBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopImmediatePropagation();
                toggleSidebarItemGroup({ groupName: btn.dataset.groupName });
            });
            btn.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.activeElement.click();
                }
            });

            if (btn.classList.contains('child-active')) {
                toggleSidebarItemGroup({ groupName: btn.dataset.groupName, childActive: true });
            }
        })
    }

    const sidebarToggleButtonInTopbar = document.querySelector('.sidebar-toggle-button-in-topbar');
    if (sidebarToggleButtonInTopbar) {
        sidebarToggleButtonInTopbar.addEventListener('click', toggleSidebar);
        sidebarToggleButtonInTopbar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSidebar();
            }
        })
    }
    const sidebarToggleButtonInSidebar = document.querySelector('.sidebar-toggle-button-in-sidebar');
    if (sidebarToggleButtonInSidebar) {
        sidebarToggleButtonInSidebar.addEventListener('click', toggleSidebar);
        sidebarToggleButtonInSidebar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSidebar();
            }
        })
    }
    const sidebar = document.querySelector('.sidebar');
    toggleSidebarOnWindowWidth(sidebar);

    const overlay = document.querySelector('.overlay');
    const contentDiv = document.querySelector('.content-min-height');
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('visible');
            sidebar.classList.add('hidden');
            sidebar.style.height = "unset";
            overlay.style.display = "none";
            overlay.style.position = "absolute";
            contentDiv.style.position = "static";
        });
    }

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

    $('.btn-copy-link').on('click', function () {
        navigator.clipboard.writeText(window.location.href);
    });

    // Init mobile nav
    if (document.getElementById('searchBar') instanceof Object) {
        const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
        const mobileSearchToggle = document.querySelector('.mobile-search-toggle');
        if (mobileNavToggle) {
            mobileNavToggle.addEventListener('click', toggleMobileNav);
        }
        if (mobileSearchToggle) {
            mobileSearchToggle.addEventListener('click', toggleMobileSearch);
        }
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
			submitDataTestId: 'cancel-modal',
        });
        $cancelModal.appendTo('body').modal('show');
    });

    populateModalForm($featureModal, {
        title: $t('loggedin.text.newFeaturesAvailable'),
        closeLabel: $t('global.button.cancel'),
		submitDataTestId: 'feature-modal',
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

	// check for in user migration mode
	if ($('#inUserMigrationStarted').length) {
		$.showNotification($t('loggedin.text.schoolInMigrationModeStarted'), 'warning');
	} else if ($('#inUserMigration').length) {
		$.showNotification($t('loggedin.text.schoolInMigrationMode'), 'warning');
	} else if ($('#schuljahrtransfer').length) {
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
        if (!(href.startsWith('https://dbildungscloud.de') || href.startsWith('#') || href.startsWith('/') || href === '')) {
            if (!a.getAttribute('target')) {
                a.setAttribute('target', '_blank');
            }
            a.classList.add('externalLink');
        }
    }
});
