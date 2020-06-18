window.addEventListener('DOMContentLoaded', () => {
	/*
	// invalid registration detected
	*/
	const message = `
	<div class="error-container">
		<div class="error-header-wrapper">
			<img class="error-header-image" src="/images/broken-pen.svg" alt="${$t('dataprivacy.img_alt.brokenPen')}" />
			<div class="text-container">
				<h1 class="h2 error-header-code text-center">${$t('dataprivacy.headline.registrationInvalid')}</h1>
				<p class="error-header-text font-weight-bold">${$t('dataprivacy.text.registrationInvalid')}</p>
				<ul>
					<li>${$t('dataprivacy.text.registrationInvalidAlreadyUsed')}</li>
					<li>${$t('dataprivacy.text.registrationInvalidManualConsent')}</li>
					<li>${$t('dataprivacy.text.registrationInvalidOutdatedLink')}</li>
				</ul>
				<p>${$t('dataprivacy.text.registrationInvalidContactAdvice')}</p>
			</div>
		</div>
	</div>
`;

	if ($("input[name='invalid']").val() === 'true') {
		$('#welcome-screen').replaceWith(message);
		$('form').replaceWith(message);
	}
});
