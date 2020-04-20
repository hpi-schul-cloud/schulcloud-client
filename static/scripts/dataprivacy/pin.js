let pinSent;
let resendTimer = null;
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
			$.showNotification(`Wir haben dir soeben einen Bestätigungscode an ${usermail} gesendet.`, 'success', 15000);
		}
		pinSent = true;
	}).fail(() => {
		const errorMessage = `Hoppla, es gab einen Fehler bei der Code-Erstellung!
			Bitte prüfe deine E-Mail-Adresse (${usermail}) und versuche es dann erneut.`;
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
		$.showNotification(`Wir haben dir bereits eine E-Mail gesendet. Bitte prüfe auch deinen Spam-Ordner, ob du wirklich keine E-Mail erhalten hast. Nach einer Minute kannst du den Code erneut anfordern.`, 'info', 7000);
	}
});
