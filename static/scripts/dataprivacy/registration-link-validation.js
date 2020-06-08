window.addEventListener('DOMContentLoaded', () => {
	/*
	// invalid registration detexted
	*/
	const message = `
	<div class="error-container">
		<div class="error-header-wrapper">
			<img class="error-header-image" src="/images/broken-pen.svg" alt="zerbrochener Stift" />
			<div class="text-container">
				<h1 class="h2 error-header-code text-center">Registrierung fehlerhaft</h1>
				<p class="error-header-text font-weight-bold">
				Deine Registrierung bzw. dieser Registrierungslink scheint nicht valide zu sein. Dies kann mehrere Gründe haben:
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
			</div>
		</div>
	</div>
`;

	if ($("input[name='invalid']").val() === 'true') {
		$('#welcome-screen').replaceWith(message);
		$('form').replaceWith(message);
	}
});
