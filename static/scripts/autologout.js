$(document).ready(() => {
	const timeOnScriptLoad = Date.now(); // timestamp on script load

	const $autoLoggoutAlertModal = $('.auto-logout-alert-modal');
	const showModalOnRemainingSeconds = $autoLoggoutAlertModal.find('.form-group').data('showOnRemainingSec') || 3600;
	const rstDefault = $autoLoggoutAlertModal.find('.form-group').data('rstDefault') || showModalOnRemainingSeconds * 2;
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
				rst = (rstDefault - Math.floor((Date.now() - timeOnScriptLoad) / 1000));
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
