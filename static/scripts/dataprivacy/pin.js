let pinSent;
let resendTimer = null;
let timeoutSend = false;

function sendPin(sendConfirm) {
	const usermail = $("input[name$='email']:last").val();
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
			$.showNotification(`Eine PIN wurde an ${usermail} versendet.`, 'success', 15000);
		}
		pinSent = true;
	}).fail(() => {
		const errorMessage = `Fehler bei der PIN-Erstellung!
			Bitte versuche es erneut und prüfe deine E-Mail-Adresse (${usermail}).`;
		$.showNotification(errorMessage, 'danger', 7000);
		timeoutSend = false;
	});
}

// if email for pin registration is changed, reset pin-sent status
$('form.registration-form.student input[name$="email"]:last').on('change', () => {
	pinSent = false;
	timeoutSend = false;
});

$('#resend-pin').on('click', (e) => {
	e.preventDefault();
	if (timeoutSend === false) {
		sendPin(true);
		$('.pin-input .digit').val('');
		timeoutSend = true;
		resendTimer = setTimeout(() => {
			timeoutSend = false;
		}, 60000);
	} else {
		$.showNotification(`Eine E-Mail wurde bereits versendet. Bitte prüfe, ob du wirklich keine E-Mail erhalten hast. Nach einer Minute kannst du die E-Mail erneut anfordern.`, 'info', 7000);
	}
});
