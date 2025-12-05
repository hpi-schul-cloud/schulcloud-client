import './jquery/datetimepicker-easy';

$(document).ready(() => {
	const $modals = $('.modal');
	const $addSystemsModal = $('.add-modal');
	const $deleteSystemsModal = $('.delete-modal');

	$('.btn-add-modal').on('click', (e) => {
		e.preventDefault();
		populateModalForm($addSystemsModal, {
			title: $t('global.button.add'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.add'),
			submitDataTestId: 'add-modal',
		});
		$addSystemsModal.appendTo('body').modal('show');
	});

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});

	function handleBtnClick(e) {
		e.preventDefault();
		const entry = $(this)
			.parent()
			.attr('action');
		$.getJSON(entry, (result) => {
			populateModalForm($deleteSystemsModal, {
				action: entry,
				title: $t('global.headline.delete'),
				closeLabel: $t('global.button.cancel'),
				submitLabel: $t('global.headline.delete'),
				submitDataTestId: 'delete-systems-modal',
				fields: result,
			});

			$deleteSystemsModal.appendTo('body').modal('show');
		});
	}
	$('.btn-delete').on('click', handleBtnClick);

	$('#csv-import-example').off('click').on('click', (e) => {
		e.preventDefault();
		const lines = [
			'firstName,lastName,email,class,birthday',
			'Max,Mustermann,max@mustermann.de,,',
			'Fritz,Schmidt,fritz.schmidt@schul-cloud.org,1a,',
			'Paula,Meyer,paula.meyer@schul-cloud.org,12/2+12/3,',
			'Hildegard,Handschuh,hildegard@handschuh.de,4b,29.11.1992',
			'Renate,Durchdenwald,renate@durchdenwald.de,,15.02.1994',
		];
		const csvContent = `data:text/csv;charset=utf-8,${lines.join('\n')}`;
		const link = document.createElement('a');
		link.setAttribute('href', encodeURI(csvContent));
		link.setAttribute('download', 'beispiel.csv');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});
});
