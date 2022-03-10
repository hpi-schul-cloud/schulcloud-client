import './pwd';
import initAlerts from './alerts';
import * as storage from './helpers/storage';

$(document).ready(() => {
	// reset localStorage when new version is Published
	const newVersion = 1;
	const currentVersion = parseInt(storage.local.getItem('homepageVersion') || '0', 10);
	let countdownNum;

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

	const $btnToggleProviders = $('.btn-toggle-providers');
	const $btnHideProviders = $('.btn-hide-providers');
	const $btnLogin = $('.btn-login');
	const $oauthButton = $('.btn-oauth');
	const $ldapButton = $('.btn-ldap');
	const $cloudButton = $('.btn-cloud');
	const $emailLoginSection = $('.email-login-section');
	const $ldapLoginSection = $('.ldap-login-section');
	const $btnLoginLdap = $('.btn-login-ldap');
	const $btnLoginCloud = $('.btn-login-cloud');
	const $returnButton = $('.btn-return');
	const $systemBtns = $('.system-buttons');
	const $loginProviders = $('.login-providers');
	const $school = $('.school');
	const $systems = $('.system');
	const $modals = $('.modal');
	const $pwRecoveryModal = $('.pwrecovery-modal');
	const $submitButton = $('#submit-login');

	const enableDisableLdapBtn = (id) => {
		if ($btnLoginLdap.data('active') === true) {
			if (id) {
				$btnLoginLdap.prop('disabled', false);
			} else {
				$btnLoginLdap.prop('disabled', true);
			}
		}
	};

	const incTimer = () => {
		setTimeout(() => {
			if (countdownNum !== 1) {
				// eslint-disable-next-line no-plusplus
				countdownNum--;
				$submitButton.val($t('login.text.pleaseWaitXSeconds', { seconds: countdownNum }));		
				$btnLoginLdap.val($t('login.text.pleaseWaitXSeconds', { seconds: countdownNum }));
				$btnLoginLdap.prop('disabled', true);
				$btnLoginLdap.data('active', false);
				$btnLoginCloud.val($t('login.text.pleaseWaitXSeconds', { seconds: countdownNum }));
				incTimer();
			} else {
				$submitButton.val($t('home.header.link.login'));
				$btnLoginLdap.val($t('login.button.ldap'));
				$btnLoginCloud.val($t('login.button.schoolCloud'));
			}
		}, 1000);
	};

	if ($submitButton.data('timeout') || $btnLoginLdap.data('timeout') || $btnLoginCloud.data('timeout')) {
		setTimeout(() => {
			$submitButton.prop('disabled', false);
			$btnLoginLdap.data('active', true);
			enableDisableLdapBtn($school.val());
			$btnLoginCloud.prop('disabled', false);
		}, $submitButton.data('timeout') * 1000,
		$btnLoginLdap.data('timeout') * 1000,
		$btnLoginCloud.data('timeout') * 1000);
		if ($btnLoginLdap.data('timeout')) {
			countdownNum = $btnLoginLdap.data('timeout');
		} else if ($btnLoginCloud.data('timeout')) {
			countdownNum = $btnLoginCloud.data('timeout');
		} else {
			countdownNum = $submitButton.data('timeout');
		}
		incTimer();
	}

	const loadSystems = (systems) => {
		$systems.empty();
		systems.forEach((system) => {
			const systemAlias = system.alias ? ` (${system.alias})` : '';
			let selected;
			if (storage.local.getItem('loginSystem') === system._id) {
				selected = true;
			}
			// eslint-disable-next-line max-len
			$systems.append(`<option ${selected ? 'selected' : ''} value="${system._id}//${system.type}">${system.type}${systemAlias}</option>`);
		});
		// eslint-disable-next-line no-unused-expressions
		systems.length < 2 ? $systems.parent().hide() : $systems.parent().show();
		$systems.trigger('chosen:updated');
	};

	const showHideButtonsMenu = (toShow) => {
		if (toShow) {
			$systemBtns.show();
		} else {
			$systemBtns.hide();
		}
	};

	const showHideEmailLoginForm = (toShow) => {
		if (toShow) {
			$emailLoginSection.show();
		} else {
			$emailLoginSection.hide();
		}
	};

	const showHideLdapLoginForm = (toShow) => {
		if (toShow) {
			$ldapLoginSection.show();
		} else {
			$ldapLoginSection.hide();
		}
	};

	$btnToggleProviders.on('click', (e) => {
		e.preventDefault();
		$btnToggleProviders.hide();
		$loginProviders.show();
	});

	$btnToggleProviders.on('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			$btnToggleProviders.hide();
			$loginProviders.show();
		}
	});

	$oauthButton.on('click', () => {
		const iservOauthSystem = JSON.parse($oauthButton[0].dataset.system);
		window.location.href = `${iservOauthSystem.oauthConfig.authEndpoint}?
		client_id=${iservOauthSystem.oauthConfig.clientId}
		&redirect_uri=${iservOauthSystem.oauthConfig.codeRedirectUri}
		&response_type=${iservOauthSystem.oauthConfig.responseType}
		&scope=${iservOauthSystem.oauthConfig.scope}`;
	});

	$cloudButton.on('click', () => {
		showHideButtonsMenu(false);
		showHideLdapLoginForm(false);
		showHideEmailLoginForm(true);
	});

	$ldapButton.on('click', () => {
		showHideButtonsMenu(false);
		showHideEmailLoginForm(false);
		showHideLdapLoginForm(true);
		$school.trigger('chosen:updated');
	});

	$returnButton.on('click', () => {
		showHideEmailLoginForm(false);
		showHideLdapLoginForm(false);
		showHideButtonsMenu(true);
	});

	$btnHideProviders.on('click', (e) => {
		e.preventDefault();
		$btnToggleProviders.show();
		$loginProviders.hide();
		$school.val('');
	});

	$btnHideProviders.on('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			$btnToggleProviders.show();
			$loginProviders.hide();
			$school.val('');
		}
	});

	$btnLogin.on('click', () => {
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

	$school.on('change', (event) => {
		// due to the class 'school' being duplicated, it is necessary to listen to the element's event to get the value
		const id = $(event.target).val();
		enableDisableLdapBtn(id);
		const dataSystems = $(event.target).find(':selected').data('systems');
		if (id !== '' && dataSystems) {
			loadSystems(dataSystems);
		} else {
			$systems.parent().hide();
		}
		$school.find('option').not(`[value='${id}']`).removeAttr('selected');
		$school.find(`option[value='${id}']`).attr('selected', true);
	});

	$('.submit-pwrecovery').on('click', (e) => {
		e.preventDefault();
		populateModalForm($pwRecoveryModal, {
			title: $t('login.popup_resetPw.headline.resetPassword'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('login.popup_resetPw.button.resetPassword'),
		});
		$pwRecoveryModal.appendTo('body').modal('show');
	});

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});

	// if stored login system - use that
	if (storage.local.getItem('loginSchool')) {
		$btnToggleProviders.hide();
		$loginProviders.show();
		$school.val(storage.local.getItem('loginSchool'));
		$school.trigger('change');
	}

	initAlerts('login');
	// remove duplicated login error
	$('.col-xs-12 > .notification').remove();
});
