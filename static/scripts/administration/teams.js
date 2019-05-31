// eslint-disable-next-line func-names
$(window).ready(() => {

	function getPayload (tableRow) {
		return JSON.parse(tableRow.find('td[payload]').data('payload'));
	}

	$('.btn-show-members').on('click', function showMemebers(e) {
		
		var $memberModal = $('.member-modal');
		var payload = getPayload($(this).parents('tr'));

		populateModal($memberModal, '#member-modal-body', payload);
		
		$memberModal.appendTo('body').modal('show');
	});

	$('.btn-write-owner').on('click', function writeOwner(e) {
		e.preventDefault();
		// e.stopPropagation();

		var $messageModal = $('.message-owner-modal');

		var entry = $(this).attr('href');

		populateModalForm($messageModal, {
			action: entry,
			title: 'Nachricht schreiben',
			closeLabel: 'Abbrechen',
			submitLabel: 'Speichern',
		});

		$messageModal.appendTo('body').modal('show');
	});

	$('.btn-delete-team').on('click', function deleteTeam(e) {
		e.preventDefault();

		var $deleteModal = $('.delete-team-modal');

		var entry = $(this).attr('href');
		var name = $(this).attr('data-name');

		populateModalForm($deleteModal, {
			action: entry,
			title: 'Löschen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Löschen',
			fields: {
				name,
			},
		});

		$deleteModal.appendTo('body').modal('show');
	});

	$('.btn-remove-members').on('click', function removeMembers(e) {
		e.preventDefault();

		var $removeModal = $('.remove-members-modal');

		var entry = $(this).attr('href');
		var name = $(this).attr('data-name');


		populateModalForm($removeModal, {
			action: entry,
			title: 'Schule aus Team entfernen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Enternen',
			fields: {
				name,
			},
		});

		$removeModal.appendTo('body').modal('show');	

	});

	$('.btn-set-teamowner').on('click', function removeMembers(e) {
		e.preventDefault();

		var $removeModal = $('.select-owner-modal');

		var entry = $(this).attr('href');
		var name = $(this).attr('data-name');


		populateModalForm($removeModal, {
			action: entry,
			title: 'Person als Eigentümer festlegen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Ernennen',
		});

		$removeModal.appendTo('body').modal('show');	

	});

	
});
