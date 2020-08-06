/* eslint-disable no-undef */
// eslint-disable-next-line func-names
$(window).ready(() => {
	function getPayload(tableRow) {
		const data = tableRow.find('td[data-payload]').data('payload');
		const json = JSON.parse(decodeURIComponent(atob(data).split('').map((value) => {
			const germanLetter = `00${value.charCodeAt(0).toString(16)}`;
			return `%${(germanLetter).slice(-2)}`}).join('')));
		return json;
	}

	function displayModalTeamMembers(headline, content) {
		const $memberModal = $('.member-modal');

		populateModal($memberModal, '.modal-title', headline);
		populateModal($memberModal, '#member-modal-body', content);

		$memberModal.appendTo('body').modal('show');
	}

	$('.btn-show-members').on('click', function showMembers(e) {
		e.preventDefault();

		const parent = $(this).closest('tr');
		const { members } = getPayload(parent);

		let teamMembers = $t('global.text.noMembers');
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

		displayModalTeamMembers($t('administration.teams.headline.membersInOwnSchool'), teamMembers);
	});

	$('.btn-show-schools').on('click', function showMembers(e) {
		e.preventDefault();
		const parent = $(this).closest('tr');
		const { schools } = getPayload(parent);

		let teamSchools = $t('administration.teams.text.noSchools');
		if ((schools || []).length !== 0) {
			teamSchools = '<ol>';
			schools.forEach((member) => {
				teamSchools += `<li>${member.name}</li>`;
			});
			teamSchools += '</ol>';
		}

		displayModalTeamMembers($t('administration.teams.headline.schools'), teamSchools);
	});

	$('.btn-write-owner').on('click', function writeOwner(e) {
		e.preventDefault();
		// e.stopPropagation();

		const $messageModal = $('.message-owner-modal');

		const entry = $(this).attr('href');

		// eslint-disable-next-line no-undef
		populateModalForm($messageModal, {
			action: entry,
			title: $t('administration.teams.headline.messageToTeamOwners'),
			closeLabel: $t('administration.teams.button.discardMessage'),
			submitLabel: $t('global.button.submit'),
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
			title: $t('global.headline.delete'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.headline.delete'),
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
			title: $t('administration.teams.headline.removeSchoolFromTeam'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('administration.teams.button.removeAllMembers'),
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
			title: $t('administration.teams.headline.newTeamOwner'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('administration.teams.button.appointTeamOwner'),
		});

		$removeModal.appendTo('body').modal('show');
	});

	$('.btn.disabled').click((event) => {
		event.preventDefault();
	});
});
