$(document).ready(() => {
	const $autoLoggoutAlertModal = $('.auto-logout-alert-modal');
	const rstDefault = 7200; // default remaining session time in sec
	const showModalOnRemainingSeconds = $autoLoggoutAlertModal.find('.form-group').data('showOnRemainingSec') || 3600;
	const maxTotalRetrys = 1;

	let rst = rstDefault; // remaining session time in sec
	let processing = false;

	populateModalForm($autoLoggoutAlertModal, {});

	const showAutoLogoutModal = ((status) => {
		// switching between  to texts inlcuded in the modal
		if (status === 'error') {
			$autoLoggoutAlertModal.find('.sloth-default').hide();
			$autoLoggoutAlertModal.find('.sloth-error').show();
		} else {
			$autoLoggoutAlertModal.find('.sloth-default').show();
			$autoLoggoutAlertModal.find('.sloth-error').hide();
		}
		$autoLoggoutAlertModal.find('.modal-header').remove();
		$autoLoggoutAlertModal.modal('show');
	});

	const decRst = (() => {
		setTimeout(() => {
			if (rst >= 60) {
				rst -= 60;
				$('.js-time').text(Math.floor(rst / 60));
				// show auto loggout alert modal
				// don't show modal while processing
				if (!processing && rst <= showModalOnRemainingSeconds) {
					showAutoLogoutModal('default');
				}
				decRst();
			}
		}, 1000 * 60);
	});

	// Sync rst with Server every 5 mins
	const syncRst = (() => {
		setInterval(() => {
			$.post('/account/ttl', ((result) => {
				const { ttl } = result; // in sec
				if (typeof ttl === 'number') {
					rst = ttl;
				}
			}));
		}, 1000 * 60 * 5);
	});

	let retry = 0;
	let totalRetry = 0;
	// extend session
	const IStillLoveYou = (async () => {
		$.post('/account/ttl', { resetTimer: true }, () => {
			// on success
			processing = false;
			totalRetry = 0;
			retry = 0;
			rst = rstDefault;
			$.showNotification('Sitzung erfolgreich verlängert.', 'success', true);
		}).fail(() => {
			// retry 4 times before showing error
			if (retry < 4) {
				retry += 1;
				setTimeout(() => {
					IStillLoveYou();
				}, (2 ** retry) * 1000);
			} else {
				retry = 0;
				if (totalRetry === maxTotalRetrys) {
					/* eslint-disable-next-line max-len */
					$.showNotification('Deine Sitzung konnte nicht verlängert werden! Bitte speichere deine Arbeit und lade die Seite neu.', 'danger', false);
				} else {
					showAutoLogoutModal('error');
				}
				totalRetry += 1;
			}
		});
	});

	decRst(); // dec. rst
	syncRst(); // Sync rst with Server

	$autoLoggoutAlertModal.find('.btn-incRst').on('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		processing = true;
		$autoLoggoutAlertModal.modal('hide');
	});

	// on modal close (button or backdrop)
	$autoLoggoutAlertModal.on('hidden.bs.modal', () => {
		processing = true;
		IStillLoveYou();
	});
});
