window.addEventListener('DOMContentLoaded', () => {
	/*
	// invalid registration detexted
	*/
	const message = `
	<h4>Registrierung fehlerhaft</h4>
	<p>Diese Registrierung bzw. dieser Registrierungslink scheint nicht valide zu sein. Dies kann mehrere Gründe haben:
		<ul>
			<li>Der Nutzer, dem dieser Registrierungslink gehört, hat sich bzw. wurde bereits registriert.</li>
			<li>
				Ein Lehrer oder Administrator hat für den entsprechenden Nutzer
				bereits die manuelle Einverständniserklärung durchgeführt.
			</li>
			<li>Der Registrierungslink ist sehr alt und nicht mehr korrekt mit dem entsprechenden Nutzer verknüpft.</li>
		</ul>
	</p>
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
