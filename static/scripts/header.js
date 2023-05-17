import initAlerts from './alerts';

$(document).ready(() => {
	// Init modals
	const $modals = $('.modal');
	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});

	$('.btn-cancel').on('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		const $cancelModal = $('.cancel-modal');
		populateModalForm($cancelModal, {
			title: $t('global.text.sureAboutDiscardingChanges'),
			submitDataTestId: 'cancel-modal',
		});
		$cancelModal.appendTo('body').modal('show');
	});

	initAlerts('header');
});
