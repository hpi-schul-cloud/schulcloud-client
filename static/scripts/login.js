import './pwd';
import './cleanup'; // see loggedin.js for loggedin users
import initAlerts from './alerts';
import * as storage from './helpers/storage';

$(document).ready(() => {
	// reset localStorage when new version is Published
	const newVersion = 1;
	const currentVersion = parseInt(storage.local.getItem('homepageVersion') || '0', 10);

	if (currentVersion < newVersion) {
		storage.local.clear();
		storage.local.setItem('homepageVersion', newVersion.toString());
	}

	try {
		console.log(`
	__  __  ____    ______      _____           __               ___            _____   ___                       __
   /\\ \\/\\ \\/\\  _\`\\ /\\__  _\\    /\\  __\`\\        /\\ \\             /\\_ \\          /\\  __\`\\/\\_ \\                     /\\ \\
   \\ \\ \\_\\ \\ \\ \\_\\ \\/_/\\ \\/    \\ \\,\\_\\_\\    ___\\ \\ \\___   __  __\\//\\ \\         \\ \\ \\/\\_\\//\\ \\     ___   __  __   \\_\\ \\
	\\ \\  _  \\ \\ ,__/  \\ \\ \\     \\/_\\___ \\  /'___\\ \\  _ \`\\/\\ \\/\\ \\ \\ \\ \\   ______\\ \\ \\/_/_\\ \\ \\   / __\`\\/\\ \\/\\ \\  /'_\` \\
	 \\ \\ \\ \\ \\ \\ \\/    \\_\\ \\__    /\\ \\_\\ \\/\\ \\__/\\ \\ \\ \\ \\ \\ \\_\\ \\ \\_\\ \\_/\\_____\\\\ \\ \\_\\ \\\\_\\ \\_/\\ \\_\\ \\ \\ \\_\\ \\/\\ \\_\\ \\
	  \\ \\_\\ \\_\\ \\_\\    /\\_____\\   \\ \`\\____\\ \\____\\\\ \\_\\ \\_\\ \\____/ /\\____\\/_____/ \\ \\____//\\____\\ \\____/\\ \\____/\\ \\___,_\\
	   \\/_/\\/_/\\/_/    \\/_____/    \\/_____/\\/____/ \\/_/\\/_/\\/___/  \\/____/         \\/___/ \\/____/\\/___/  \\/___/  \\/__,_ /
	`);
		console.log($t('home.text.advertisementForOurTeam'));
	} catch (e) {
		// no log
	}

	const checkCookie = () => {
		let { cookieEnabled } = navigator;
		if (!cookieEnabled) {
			document.cookie = 'testcookie';
			cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
		}
		return cookieEnabled;
	};
	if (!checkCookie()) {
		$('.alert-cookies-blocked').removeClass('hidden');
	}

    var $btnToggleProviers = $('.btn-toggle-providers');
    var $btnHideProviers = $('.btn-hide-providers');
    var $btnLogin = $('.btn-login');
    var $loginProviders = $('.login-providers');
    var $school = $('.school');
    var $systems = $('.system');
    var $modals = $('.modal');
    var $pwRecoveryModal = $('.pwrecovery-modal');
    var $submitButton = $('#submit-login');

    var incTimer = function(){
        setTimeout (function(){
            if(countdownNum != 1){
                countdownNum--;
                $submitButton.val($t('login.text.pleaseWaitXSeconds',{seconds : countdownNum}));
                incTimer();
            } else {
                $submitButton.val($t('home.header.link.login'));
            }
        },1000);
    };

    if($submitButton.data('timeout')){
        setTimeout (function(){
            $submitButton.prop('disabled', false);
        },$submitButton.data('timeout')*1000);

        var countdownNum = $submitButton.data('timeout');
        incTimer();
    }

    var loadSystems = function(schoolId) {
        $systems.empty();
        $.getJSON('/login/systems/' + schoolId, function(systems) {
            systems.forEach(function(system) {
                var systemAlias = system.alias ? ' (' + system.alias + ')' : '';
                let selected;
                if(storage.local.getItem('loginSystem') == system._id) {
                    selected = true;
                }
                $systems.append('<option ' + (selected ? 'selected': '') + ' value="' + system._id + '//' + system.type + '">' + system.type + systemAlias + '</option>');
            });
            $systems.trigger('chosen:updated');
            systems.length < 2 ? $systems.parent().hide() : $systems.parent().show();
        });
    };

    $btnToggleProviers.on('click', function(e) {
        e.preventDefault();
        $btnToggleProviers.hide();
        $loginProviders.show();
    });

    $btnHideProviers.on('click', function(e) {
        e.preventDefault();
        $btnToggleProviers.show();
        $loginProviders.hide();
        $school.val('');
        $school.trigger('chosen:updated');
        $systems.val('');
        $systems.trigger('chosen:updated');
    });

    $btnLogin.on('click', function (e) {
        const school = $school.val();
        const system = $systems.val();
        if (school) {
            storage.local.setItem('loginSchool', school);
        } else {
            storage.local.removeItem('loginSchool');
        }
        if (system) {
            storage.local.setItem('loginSystem', system);
        } else {
            storage.local.removeItem('loginSystem');
        }
    });

    $school.on('change', function() {
        const id = $(this).val();
        loadSystems( id );
        $school.find("option").not("[value='"+id+"']").removeAttr('selected');
        $school.find("option[value='"+id+"']").attr('selected',true);
        $school.trigger('chosen:updated');
    });

    $('.submit-pwrecovery').on('click', function(e) {
        e.preventDefault();
        populateModalForm($pwRecoveryModal, {
            title: $t('login.popup_resetPw.headline.resetPassword'),
            closeLabel: $t('global.button.cancel'),
            submitLabel: $t('login.popup_resetPw.button.resetPassword'),
        });
        $pwRecoveryModal.appendTo('body').modal('show');
    });

    $modals.find('.close, .btn-close').on('click', function() {
        $modals.modal('hide');
    });

    // if stored login system - use that
    if(storage.local.getItem('loginSchool')) {
        $btnToggleProviers.hide();
        $loginProviders.show();
        $school.val(storage.local.getItem('loginSchool'));
        $school.trigger('chosen:updated');
        $school.trigger('change');
    }

    initAlerts('login');
    // remove duplicated login error
    $( ".col-xs-12 > .notification" ).remove();
});
