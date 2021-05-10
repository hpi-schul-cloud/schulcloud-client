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
	const $loginProviders = $('.login-providers');
	const $school = $('.school');
	const $systems = $('.system');
	const $modals = $('.modal');
	const $pwRecoveryModal = $('.pwrecovery-modal');
	const $submitButton = $('#submit-login');

	const incTimer = () => {
		setTimeout(() => {
			if (countdownNum !== 1) {
				// eslint-disable-next-line no-plusplus
				countdownNum--;
				$submitButton.val($t('login.text.pleaseWaitXSeconds', { seconds: countdownNum }));
				incTimer();
			} else {
				$submitButton.val($t('home.header.link.login'));
			}
		}, 1000);
	};

	if ($submitButton.data('timeout')) {
		setTimeout(() => {
			$submitButton.prop('disabled', false);
		}, $submitButton.data('timeout') * 1000);

		countdownNum = $submitButton.data('timeout');
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
