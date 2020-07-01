let timeoutSend = false;
let usermail;

function sendPin(sendConfirm) {
	usermail = $("input[name$='email']:last").val();
	let role;
	try {
		role = window.location.pathname.split('/by')[1].split('/')[0].replace('/', '');
	} catch (e) {
		if (window.location.pathname === '/firstLogin') { role = 'parent'; }
	}
	$.ajax({
		url: '/registration/pincreation',
		method: 'POST',
		data: { email: usermail, mailTextForRole: role },
	}).done(() => {
		if (sendConfirm) {
			$.showNotification($t('dataprivacy.text.confirmationCodeSent', { email: usermail }),
				'success',
				15000);
		}
	}).fail((err) => {
		let errorMessage;
		if (err.status === 400) {
			errorMessage = $t('dataprivacy.text.providerBlocked', { email: usermail });
		} else {
			errorMessage = $t('dataprivacy.text.errorGeneratingConfirmationCode', { email: usermail });
		}

		$.showNotification(errorMessage, 'danger', 7000);
		timeoutSend = false;
	});
}

// if email for pin registration is changed, reset pin-sent status
$('form.registration-form.student input[name$="email"]:last').on('change', () => {
	timeoutSend = false;
});

$('#resend-pin').on('click', (e) => {
	e.preventDefault();
	if (timeoutSend === false) {
		sendPin(true);
		$('.pin-input .digit').val('');
		timeoutSend = true;
		setTimeout(() => {
			timeoutSend = false;
		}, 60000);
	} else {
		$.showNotification($t('dataprivacy.text.confirmationCodeAlreadySent'),
			'info',
			7000);
	}
});
