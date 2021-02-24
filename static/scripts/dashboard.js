$(document).ready(() => {
	const $modals = $('.modal');
	const $pollModal = $('.poll-modal');

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});

	$('.feature-modal').modal('show');

	populateModalForm($pollModal, {
		title: $t('dashboard.headline.poll2Title'),
		closeLabel: $t('global.button.cancel'),
	});

	const prefs = $('#preferences').html();

	const parsedPrefs = prefs === '' ? {} : JSON.parse($('#preferences').html());

	if (!parsedPrefs.pollSeen2) $pollModal.appendTo('body').modal('show');

	$('.btn-poll').on('click', (e) => {
		e.preventDefault();

		$.ajax({
			type: 'POST',
			url: '/account/preferences',
			data: { attribute: { key: 'pollSeen2', value: true } },
		});

		window.open('https://tools.openhpi.de/survey/index.php?r=survey/index&sid=345643&newtest=Y&lang=de', '_target');
		$pollModal.modal('hide');
	});

	$('.dismiss-privacy-alert-feb21').on('click', (e) => {
		e.preventDefault();
		const checkbox = $('.privacy-alert-feb21 .do-not-show-again');

		if (checkbox.length > 0 && checkbox[0].checked) {
			$.ajax({
				type: 'POST',
				url: '/account/preferences',
				data: { attribute: { key: 'data_privacy_incident_note_2021_02_dismissed', value: new Date() } },
			});
		}

		$('.privacy-alert-feb21').hide();
	});
});
