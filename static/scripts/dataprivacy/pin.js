let pinSent;

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
			$.showNotification(`Eine PIN wurde erfolgreich an ${usermail} versendet.`, 'success', 15000);
		}
		pinSent = true;
	}).fail(() => {
		const errorMessage = `Fehler bei der PIN-Erstellung!
			Bitte versuche es mit 'Code erneut zusenden' und prüfe deine E-Mail-Adresse (${usermail}).`;
		$.showNotification(errorMessage, 'danger', 7000);
	});
}

// if email for pin registration is changed, reset pin-sent status
$('form.registration-form.student input[name$="email"]:last').on('change', () => {
	pinSent = false;
});

$('.form section[data-feature="pin"]').on('showSection', () => {
	if (pinSent) {
		// send pin of value is something else than no
	} else {
		sendPin(true);
	}
});

$('#resend-pin').on('click', (e) => {
	e.preventDefault();
	sendPin(true);
	$('.pin-input .digit').val('');
});
