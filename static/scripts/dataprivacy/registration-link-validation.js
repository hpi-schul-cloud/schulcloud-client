window.addEventListener('DOMContentLoaded', () => {
	/*
	// invalid registration detexted
	*/
	const message = `
<main class="container pt-3 mt-5 text-center>
	<div class="error-header-wrapper">
	<img class="error-header-image w-100 h-100" src="/images/broken-pen.svg" alt="zerbrochener Stift" />
	<h1 class="h1 error-header-code text-center">Registrierung fehlerhaft</h1>
	<p class="error-header-text text-center">
	Diese Registrierung bzw. dieser Registrierungslink scheint nicht valide zu sein. Dies kann mehrere Gründe haben:
	</p>
	<ul>
			<li>Der Nutzer, dem dieser Registrierungslink gehört, hat sich bzw. wurde bereits registriert.</li>
			<li>
				Ein Lehrer oder Administrator hat für den entsprechenden Nutzer
				bereits die manuelle Einverständniserklärung durchgeführt.
			</li>
			<li>Der Registrierungslink ist sehr alt und nicht mehr korrekt mit dem entsprechenden Nutzer verknüpft.</li>
		</ul>
	<p>Bitte kontaktiere einen verantwortlichen Lehrer oder Administrator und frage diesbezüglich nach.
		Dieser kann weiterhelfen oder auch einen neuen Registrierungslink erstellen, falls nötig.</p>
`;

	if ($("input[name='invalid']").val() === 'true') {
		$('#welcome-screen')
			.empty()
			.append(message);
		$('#welcome-screen').replaceWith(message);
		$('form').replaceWith(message);
	}
});
