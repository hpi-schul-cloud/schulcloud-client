/* eslint-disable no-undef */
// eslint-disable-next-line func-names
$(window).ready(() => {
	function getPayload(tableRow) {
		const json = tableRow.find('td[data-payload]').data('payload');
		return json;
	}

	function displayModalTeamMembers(headline, content) {
		const $memberModal = $('.member-modal');

		populateModal($memberModal, '.modal-title', headline);
		populateModal($memberModal, '#member-modal-body', content);

		$memberModal.appendTo('body').modal('show');
	}

	$('.btn-show-members').on('click', function showMemebers(e) {
		e.preventDefault();

		const parent = $(this).closest('tr');
		const { members } = getPayload(parent);

		let teamMembers = 'Keine Teilnehmer';
		if ((members || []).length !== 0) {
			teamMembers = '<ol>';
			members.forEach((member) => {
				const { user } = member; // userId was populated
				if (user.fullName) {
					teamMembers = `${teamMembers}<li>${user.fullName} (${
						member.role
					})</li>`;
				} else {
					teamMembers = `${teamMembers}<li>${user.firstName} ${
						user.lastName
					} (${member.role})</li>`;
				}
			});
			teamMembers += '</ol>';
		}

		displayModalTeamMembers('Mitglieder an eigener Schule', teamMembers);
	});

	$('.btn-show-schools').on('click', function showMemebers(e) {
		e.preventDefault();
		const parent = $(this).closest('tr');
		const { schools } = getPayload(parent);

		let teamSchools = 'Keine Schulen';
		if ((schools || []).length !== 0) {
			teamSchools = '<ol>';
			schools.forEach((member) => {
				teamSchools += `<li>${member.name}</li>`;
			});
			teamSchools += '</ol>';
		}

		displayModalTeamMembers('Schulen', teamSchools);
	});

	$('.btn-write-owner').on('click', function writeOwner(e) {
		e.preventDefault();
		// e.stopPropagation();

		const $messageModal = $('.message-owner-modal');

		const entry = $(this).attr('href');

		// eslint-disable-next-line no-undef
		populateModalForm($messageModal, {
			action: entry,
			title: 'Neue Nachricht an den/die Team-Eigentümer senden',
			closeLabel: 'Verwerfen',
			submitLabel: 'Absenden',
		});

		$messageModal.appendTo('body').modal('show');
	});

	$('.btn-delete-team').on('click', function deleteTeam(e) {
		e.preventDefault();

		const $deleteModal = $('.delete-team-modal');

		const entry = $(this).attr('href');
		const name = $(this).attr('data-name');

		// eslint-disable-next-line no-undef
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

		const $removeModal = $('.remove-members-modal');

		const entry = $(this).attr('href');
		const name = $(this).attr('data-name');

		// eslint-disable-next-line no-undef
		populateModalForm($removeModal, {
			action: entry,
			title: 'Schule aus Team entfernen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Alle Mitglieder entfernen',
			fields: {
				name,
			},
		});

		$removeModal.appendTo('body').modal('show');
	});

	$('.btn-set-teamowner').on('click', function removeMembers(e) {
		e.preventDefault();

		const $removeModal = $('.select-owner-modal');

		const entry = $(this).attr('href');

		// eslint-disable-next-line no-undef
		populateModalForm($removeModal, {
			action: entry,
			title: 'Einen zusätzlichen Team-Eigentümer ernennen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Ernennen',
		});

		$removeModal.appendTo('body').modal('show');
	});

	$('.btn.disabled').click((event) => {
		event.preventDefault();
	});
});
