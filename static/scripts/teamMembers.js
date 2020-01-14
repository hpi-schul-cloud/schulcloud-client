/* eslint-disable max-len */
/* eslint-disable no-undef */
// jshint esversion: 6

$(document).ready(() => {
	const handler = {
		get(target, name) {
			return name in target ? target[name] : '';
		},
		set(obj, prop, value) {
			obj[prop] = value;
			if (prop === 'role' && value === 'expert') {
				obj.method = 'email';
			}
			if (['role', 'method'].includes(prop)) {
				// eslint-disable-next-line no-use-before-define
				renderExternalInviteModal();
			}
			if (['tab'].includes(prop)) {
				// eslint-disable-next-line no-use-before-define
				renderInternalInviteModal();
			}
			return true;
		},
	};

	const state = new Proxy({
		tab: 'person',
		role: 'teacher',
		method: 'directory',
		currentInvitationEmail: '',
	}, handler);

	const $inviteExternalMemberModal = $('.invite-external-member-modal');

	// ///////////
	// Add internal member
	// ///////////
	function renderInternalInviteModal() {
		$('.btn-set-tab[data-tab]').removeClass('btn-primary');
		$('.btn-set-tab[data-tab]').addClass('btn-secondary');
		$(`.btn-set-tab[data-tab='${state.tab}']`).removeClass('btn-secondary');
		$(`.btn-set-tab[data-tab='${state.tab}']`).addClass('btn-primary');

		$('.form-group[data-tab]').hide();
		$(`.form-group[data-tab='${state.tab}']`).show();
	}

	renderInternalInviteModal();

	$('.btn-add-member').click((e) => {
		e.stopPropagation();
		e.preventDefault();
		const $addMemberModal = $('.add-member-modal');
		populateModalForm($addMemberModal, {
			title: 'Teilnehmer hinzufügen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Hinzufügen',
		});

		// Needed? const $modalForm = $addMemberModal.find('.modal-form');
		$addMemberModal.appendTo('body').modal('show');
	});

	$('.btn-set-tab').click(function setTabEvent(e) {
		e.stopPropagation();
		e.preventDefault();
		state.tab = this.getAttribute('data-tab');
		return false;
	});

	$('.add-member-modal form').on('submit', function addMemberModalEvent(e) {
		e.stopPropagation();
		e.preventDefault();

		let userIds = $('.add-member-modal form .form-users select').val();
		userIds = userIds.map(userId => ({ userId }));

		const classIds = $('.add-member-modal form .form-classes select').val();

		$.ajax({
			url: $(this).attr('action'),
			method: 'POST',
			data: {
				userIds,
				classIds,
			},
		}).done(() => {
			$.showNotification('Teilnehmer erfolgreich zum Team hinzugefügt', 'success', true);
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		}).fail(() => {
			$.showNotification('Problem beim Hinzufügen der Teilnehmer', 'danger', true);
		});

		return false;
	});

	// ///////////
	// Add external Member
	// ///////////
	function renderExternalInviteModal() {
		$('.btn-set-role[data-role]').removeClass('btn-primary');
		$('.btn-set-role[data-role]').addClass('btn-secondary');
		$(`.btn-set-role[data-role='${state.role}']`).removeClass('btn-secondary');
		$(`.btn-set-role[data-role='${state.role}']`).addClass('btn-primary');

		$('.form-group[data-role]').hide();
		$(`.form-group[data-role='${state.role}']`).show();

		$('.btn-set-method[data-method]').removeClass('btn-primary');
		$('.btn-set-method[data-method]').addClass('btn-secondary');
		$(`.btn-set-method[data-method='${state.method}']`).removeClass('btn-secondary');
		$(`.btn-set-method[data-method='${state.method}']`).addClass('btn-primary');

		$('.form-group[data-method]').hide();
		$(`.form-group[data-method='${state.method}']`).show();
	}

	renderExternalInviteModal();

	$('.btn-invite-external-member').click((e) => {
		e.stopPropagation();
		e.preventDefault();
		populateModalForm($inviteExternalMemberModal, {
			title: 'Externen Teilnehmer einladen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Teilnehmer einladen',
		});

		$('#federalstate').trigger('change');

		// Needed? const $modalForm = $inviteExternalMemberModal.find('.modal-form');
		$inviteExternalMemberModal.appendTo('body').modal('show');
	});

	$('.btn-set-role').click(function setRoleEvent(e) {
		e.stopPropagation();
		e.preventDefault();
		state.role = this.getAttribute('data-role');
		return false;
	});

	$('.btn-set-method').click(function setMethodEvent(e) {
		e.stopPropagation();
		e.preventDefault();
		state.method = this.getAttribute('data-method');
		return false;
	});

	const populateSchools = (federalState) => {
		$.ajax({
			type: 'GET',
			url: `${window.location.origin}/schools`,
			data: {
				$limit: false,
				federalState,
				hideOwnSchool: true,
			},
		}).done((schools) => {
			const schoolSelect = $('#school');
			schoolSelect.find('option').remove();
			schools.forEach((school) => {
				if (school.purpose === 'expert') return;
				schoolSelect.append(`<option value="${school._id}">${school.name}</option>`);
			});
			schoolSelect.trigger('chosen:updated');
			$('#school').trigger('change');
		}).fail(() => {
			$.showNotification('Problem beim Auslesen der Schulen', 'danger', true);
			$('#teacher').find('option').remove();
		});
	};

	$('#federalstate').on('change', (e) => {
		populateSchools(e.target.value);
	});

	const populateTeachers = (schoolId) => {
		const teacherSelect = $('#teacher');
		teacherSelect.find('option').remove();
		teacherSelect.trigger('chosen:updated');
		$.ajax({
			type: 'GET',
			url: `${window.location.origin}/users/teachersOfSchool`,
			data: {
				schoolId,
			},
		}).done((users) => {
			users.forEach((user) => {
				teacherSelect.append(`<option value="${user._id}">${user.firstName} ${user.lastName}</option>`);
			});
			teacherSelect.trigger('chosen:updated');
		}).fail(() => {
			$.showNotification('Problem beim Auslesen der Lehrer', 'danger', true);
		});
	};

	$('#school').on('change', (e) => {
		populateTeachers(e.target.value);
	});

	function validateEmail(email) {
		// eslint-disable-next-line no-useless-escape
		const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}

	// eslint-disable-next-line consistent-return
	$('.invite-external-member-modal form').on('submit', function inviteExternalEvent(e) {
		e.stopPropagation();
		e.preventDefault();
		const { origin } = window.location;
		const teamId = $inviteExternalMemberModal.find('.modal-form .form-group').attr('data-teamId');

		if (!teamId) {
			$.showNotification('Bitte lade die Seite neu.', 'danger', true);
			return false;
		}

		const userId = $('#teacher').val();
		// eslint-disable-next-line no-nested-ternary
		const userRole = state.role === 'teacher' ? 'teamadministrator'
			: (state.role === 'expert' ? 'teamexpert' : '');
		let email;

		if (state.method === 'email') {
			email = $(this).find(`div[data-role="${state.role}"] #email`).val();

			if (!validateEmail(email)) {
				$.showNotification('Bitte gib eine gültige E-Mail an.', 'danger', true);
				return false;
			}
		}

		$.ajax({
			type: 'POST',
			url: `${origin}/teams/external/invite`,
			data: {
				teamId,
				userId: state.method === 'directory' ? userId : undefined,
				role: userRole,
				email: state.method === 'email' ? email : undefined,
			},
		}).done(() => {
			if (state.method === 'email') {
				$.showNotification(
					'Wenn die E-Mail in unserem System existiert, wurde eine Team-Einladungsmail versendet.',
					'info',
					// eslint-disable-next-line comma-dangle
					true
				);
			} else {
				$.showNotification('Lehrer erfolgreich zum Team eingeladen', 'success', true);
			}

			$inviteExternalMemberModal.modal('hide');
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		}).fail(() => {
			$.showNotification(
				'Möglicherweise gab es Probleme bei der Einladung. Bitte eingeladenen Nutzer oder Admins fragen.',
				'danger',
				// eslint-disable-next-line comma-dangle
				true
			);
		});
	});

	/*
	// Resend/delete invitation
	*/
	$('.btn-resend-invitation').click(function resendInvitationEvent(e) {
		e.stopPropagation();
		e.preventDefault();
		const $resendInvitationModal = $('.resend-invitation-modal');
		state.currentInvitationEmail = $(this).parents('tr').find('[data-payload]').data('payload').email;

		populateModalForm($resendInvitationModal, {
			title: 'Einladung erneut versenden',
			closeLabel: 'Abbrechen',
			submitLabel: 'Einladung versenden',
		});

		$resendInvitationModal.appendTo('body').modal('show');
	});

	$('.resend-invitation-modal form').on('submit', function resendInvitationModalEvent(e) {
		e.stopPropagation();
		e.preventDefault();

		$.ajax({
			url: $(this).attr('action'),
			method: 'PATCH',
			data: {
				email: state.currentInvitationEmail,
			},
		}).done(() => {
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		}).fail(() => {
			$.showNotification('Problem beim Versenden der Einladung', 'danger', true);
		});

		return false;
	});

	$('.btn-delete-invitation').click(function deleteInvitationEvent(e) {
		e.stopPropagation();
		e.preventDefault();
		const $deleteMemberModal = $('.delete-invitation-modal');
		state.currentInvitationEmail = $(this).parents('tr').find('[data-payload]').data('payload').email;

		populateModalForm($deleteMemberModal, {
			title: 'Einladung löschen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Einladung löschen',
		});

		$deleteMemberModal.appendTo('body').modal('show');
	});

	$('.delete-invitation-modal form').on('submit', function deleteInvitationModalEvent(e) {
		e.stopPropagation();
		e.preventDefault();

		$.ajax({
			url: $(this).attr('action'),
			method: 'DELETE',
			data: {
				email: state.currentInvitationEmail,
			},
		}).done(() => {
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		}).fail(() => {
			$.showNotification('Problem beim Löschen der Einladung', 'danger', true);
		});

		return false;
	});

	// ///////////
	// Edit Member
	// ///////////
	$('.btn-edit-member').click(function editMemberEvent(e) {
		e.stopPropagation();
		e.preventDefault();
		const $editMemberModal = $('.edit-member-modal');
		const userId = $(this).parent().parent().find('[data-payload]')
			.data('payload');
		populateModalForm($editMemberModal, {
			title: 'Teilnehmer bearbeiten',
			closeLabel: 'Abbrechen',
			submitLabel: 'Teilnehmer bearbeiten',
			payload: userId,
		});

		// needed?? const $modalForm = $editMemberModal.find('.modal-form');
		$editMemberModal.appendTo('body').modal('show');
	});

	$('.edit-member-modal form').on('submit', function editMemberModalEvent(e) {
		e.stopPropagation();
		e.preventDefault();

		if (!$(this).find('#role').val()) {
			$.showNotification('Bitte wähle eine Rolle aus.', 'danger', true);
			return false;
		}

		const user = {
			userId: $(this).data('payload').userId,
			role: $(this).find('#role').val(),
		};

		$.ajax({
			url: $(this).attr('action'),
			method: 'PATCH',
			data: {
				user,
			},
		}).done(() => {
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		}).fail(() => {
			$.showNotification('Problem beim Bearbeiten des Teilnehmers', 'danger', true);
		});

		return false;
	});

	// ///////////
	// Delete Member
	// ///////////
	$('.btn-delete-member:not(.disabled)').click(function delelteMemberEvent(e) {
		e.stopPropagation();
		e.preventDefault();
		const $deleteMemberModal = $('.delete-member-modal');
		const userIdToRemove = $(this).parent().parent().find('[data-payload]')
			.data('payload');
		populateModalForm($deleteMemberModal, {
			title: 'Teilnehmer löschen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Teilnehmer löschen',
			payload: userIdToRemove,
		});

		// Needed?? const $modalForm = $deleteMemberModal.find('.modal-form');
		$deleteMemberModal.appendTo('body').modal('show');
	});

	$('.delete-member-modal form').on('submit', function deleteEvent(e) {
		e.stopPropagation();
		e.preventDefault();
		const userIdToRemove = $(this).data('payload').userId;

		$.ajax({
			url: $(this).attr('action'),
			method: 'DELETE',
			data: {
				userIdToRemove,
			},
		}).done(() => {
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		}).fail(() => {
			$.showNotification('Problem beim Löschen des Teilnehmers', 'danger', true);
		});

		return false;
	});

	// ///////////
	// Delete Class
	// ///////////
	$('.btn-delete-class').click(function deleteClassEvent(e) {
		e.stopPropagation();
		e.preventDefault();
		const $deleteClassModal = $('.delete-class-modal');
		const classIdToRemove = $(this).parent().parent().find('[data-payload]')
			.data('payload');
		populateModalForm($deleteClassModal, {
			title: 'Klasse löschen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Klasse löschen',
			payload: classIdToRemove,
		});

		// Needed?? const $modalForm = $deleteClassModal.find('.modal-form');
		$deleteClassModal.appendTo('body').modal('show');
	});

	$('.delete-class-modal form').on('submit', function deleteClassModalEvent(e) {
		e.stopPropagation();
		e.preventDefault();
		const classIdToRemove = $(this).data('payload').classId;

		$.ajax({
			url: $(this).attr('action'),
			method: 'DELETE',
			data: {
				classIdToRemove,
			},
		}).done(() => {
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		}).fail(() => {
			$.showNotification('Problem beim Löschen des Teilnehmers', 'danger', true);
		});

		return false;
	});
});
