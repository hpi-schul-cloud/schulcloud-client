let initialized = false;
$(document).ready(() => {
	if (initialized) {
		return;
	}
	initialized = true;
	const BACKEND_URL = (document.querySelector('script[data-backendurl]').dataset.backendurl).replace(/\/$/, '');
	const getJwt = (() => {
		const rawJwt = document.cookie.split(';').filter(item => item.includes('jwt'));
		return rawJwt[0].replace('jwt=', '');
	});

	let timeOnStart = Date.now(); // timestamp on script load
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
			$autoLoggoutAlertModal.find('.parrot-default').hide();
			$autoLoggoutAlertModal.find('.parrot-error').show();
		} else {
			$autoLoggoutAlertModal.find('.parrot-default').show();
			$autoLoggoutAlertModal.find('.parrot-error').hide();
		}
		$autoLoggoutAlertModal.find('.modal-header').remove();
		$autoLoggoutAlertModal.modal('show');
	});

	const decRst = (() => {
		setTimeout(() => {
			if (rst >= 60) {
				rst = Math.max(0, rstDefault - Math.floor((Date.now() - timeOnStart) / 1000));
				$('.js-time').text(Math.floor(rst / 60));
				// show auto loggout alert modal
				// don't show modal while processing
				if (!processing && rst <= showModalOnRemainingSeconds) {
					showAutoLogoutModal('default');
				}
				decRst();
			}
		}, 1000 * 20);
	});

	let retry = 0;
	let totalRetry = 0;
	// extend session
	const IStillLoveYou = (async () => {
		$.ajax({
			url: `${BACKEND_URL}/accounts/jwtTimer`,
			type: 'POST',
			dataType: 'json',
			// Fetch the stored token from localStorage and set in the header
			headers: { Authorization: `Bearer ${getJwt()}` },
		})
			.done(() => {
				processing = false;
				totalRetry = 0;
				retry = 0;
				$.showNotification($t('autologout.text.sessionExtended'), 'success', true);
				timeOnStart = Date.now();
				// check if decRst needs to be restarted
				if (rst < 60) {
					decRst();
				}
				rst = rstDefault;
			})
			.fail((err) => {
				if (err && err.status !== 401) {
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
							$.showNotification($t('autologout.text.sessionCouldNotBeExtended'), 'danger', false);
						} else {
							showAutoLogoutModal('error');
						}
						totalRetry += 1;
					}
				} else {
					// Session was expired due to inactivity - autologout
					window.location.href = '/login';
					/* eslint-disable-next-line max-len */
					$.showNotification($t('autologout.text.sessionAlreadyExpired'), 'danger', false);
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
