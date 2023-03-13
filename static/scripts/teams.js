/* eslint-disable no-undef */
// jshint esversion: 6

import 'jquery-datetimepicker';
import './jquery/datetimepicker-easy';
import { initVideoconferencing } from './videoconference';

const datetime = require('./datetime/datetime');

/**
 * transform a event modal-form for team events
 * @param modal {DOM-Element} - the given modal which will be transformed
 * @param event {object} - a team event
 */
function transformTeamEvent(modal, event) {
	const teamId = event['x-sc-teamId'];
	$.getJSON(`/teams/${teamId}/json`, (team) => {
		const $title = modal.find('.modal-title');
		$title.html(`${$title.html()}, Team: ${team.team.name}`);

		const $modalForm = modal.find('.modal-form');
		if (!$modalForm.find('input[name=teamId]').length) {
			// append team id field if it is missing
			$modalForm.append('<input name=\'teamId\' type=\'hidden\'>');
		}
		modal.find('input[name=scopeId]').attr('value', event['x-sc-teamId']);
		modal.find('input[name=teamId]').attr('value', event['x-sc-teamId']);

		modal.find('.create-team-event').remove();
		modal.find('.create-course-event').remove();
	});
}

$(document).ready(() => {
	const $createEventModal = $('.create-event-modal');
	const $editEventModal = $('.edit-event-modal');
	const $filePermissionsModal = $('.file-permissions-modal');
	const $deleteTeamModal = $('.delete-team-modal');

	const handler = {
		get(target, name) {
			return name in target ? target[name] : '';
		},
		set(obj, prop, value) {
			obj[prop] = value;
			return obj[prop] === value;
		},
	};

	const state = new Proxy({
		currentEvent: {},
	}, handler);

	$('.btn-create-event').click(() => {
		// open create event modal
		const [startDate, endDate] = datetime.inputRange({ toOffset: 1, toOffsetBase: 'hour' });

		$createEventModal.find('.create-videoconference').show();

		populateModalForm($createEventModal, {
			title: $t('global.headline.addDate'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.add'),
			fields: {
				startDate,
				endDate,
			},
		});

		$createEventModal.appendTo('body').modal('show');
	});

	// eslint-disable-next-line consistent-return
	$('.btn-edit-event').click(function editClickEvent(e) {
		e.preventDefault();
		const event = $(this).parents('.events-card').data('event');
		state.event = event;

		if (event.url) {
			window.location.href = event.url;
			return false;
		}
		event.startDate = datetime.toDateTimeString(event.start);
		event.endDate = datetime.toDateTimeString(event.end || event.start);
		event.featureVideoConference = event.attributes['x-sc-featurevideoconference'];
		populateModalForm($editEventModal, {
			title: $t('global.headline.dateDetails'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.save'),
			fields: event,
			action: `/teams/calendar/events/${event.attributes.uid}`,
		});
		$editEventModal.find('input[name=featureVideoConference]')
			.bootstrapToggle(event.featureVideoConference ? 'on' : 'off');
		$editEventModal.find('.create-videoconference').show();

		transformTeamEvent($editEventModal, event);

		$editEventModal.find('.btn-delete').click(() => {
			$.ajax({
				url: `/calendar/events/${event.attributes.uid}`,
				type: 'DELETE',
				success(result) {
					window.location.reload();
				},
			});
		});
		$editEventModal.appendTo('body').modal('show');
	});

	$editEventModal.on('submit', (e) => {
		e.stopPropagation();
		e.preventDefault();

		$.ajax({
			url: `/teams/events/${state.event.attributes.uid}`,
			type: 'PUT',
			data: $('.edit-event-modal form').serialize(),
			success(result) {
				window.location.reload();
			},
		});
	});

	$('.btn-file-permissions').click(() => {
		populateModalForm($filePermissionsModal, {
			title: $t('teams._team.files.headline.changeFilePermissions'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.save'),
		});
		$filePermissionsModal.appendTo('body').modal('show');
	});

	$('.file-permissions-modal form').on('submit', (e) => {
		e.stopPropagation();
		e.preventDefault();

		$.ajax({
			url: `/teams/${$('.section-teams').data('id')}/json`,
			method: 'GET',
		})
			.done((data) => {
				const allowed = {
					teamexpert: $('.file-permissions-modal input[name="externalExperts"]').prop('checked'),
					teammember: $('.file-permissions-modal input[name="teamMembers"]').prop('checked'),
				};

				const { filePermission } = data.team;

				const newPermission = filePermission
					.filter((permission) => ['teamexpert', 'teammember'].indexOf(permission.roleName) > -1)
					.map((permission) => {
						const setPermission = ['create', 'read', 'delete', 'write'].reduce((obj, right) => {
							obj[right] = allowed[permission.roleName];
							return obj;
						}, {});

						return Object.assign(permission, setPermission);
					});

				$.ajax({
					url: `/teams/${$('.section-teams').data('id')}/permissions`,
					method: 'PATCH',
					data: { filePermission: Object.assign(filePermission, newPermission) },
				})
					.done(() => {
						$.showNotification($t('teams._team.files.text.changedFilePermissionsSuccess'), 'success', true);
						$('.file-permissions-modal').modal('hide');
					})
					.fail(() => {
						$.showNotification($t('global.text.errorChangingFilePermissions'), 'danger', true);
					});
			})
			.fail(() => {
				$.showNotification($t('global.text.errorChangingFilePermissions'), 'danger', true);
			});
	});

	/**
	 * Leave Team
	 *
	 */
	$('.dropdown-leave-team').click(function leaveTeam(e) {
		e.stopPropagation();
		e.preventDefault();
		const $leaveTeamModal = $('.leave-team-modal');
		const userId = $(this).data('user-id');
		const userFilesToRemove = $(this).data('user-files');
		populateModalForm($leaveTeamModal, {
			title: $t('teams._team.headline.leaveTeam'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('teams._team.button.leaveTeam'),
			payload: { userId },
		});

		const $deleteInfoAlert = $leaveTeamModal.find('.alert');
		const $fileList = $leaveTeamModal.find('.file-list');

		if (userFilesToRemove && userFilesToRemove.length > 0) {
			let fileListHtmlLi = '';

			for (const file of userFilesToRemove) {
				fileListHtmlLi += `<li>${file}</li>`;
			}

			$deleteInfoAlert.show();
			$fileList.show();

			$fileList.html(fileListHtmlLi);
		} else {
			$deleteInfoAlert.hide();
			$fileList.hide();
		}

		$leaveTeamModal.appendTo('body').modal('show');
	});

	$('.leave-team-modal form').on('submit', function leaveTeamModal(e) {
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
			window.location.replace('/teams');
		}).fail(() => {
			$.showNotification($t('teams._team.members.text.errorWhileRemovingMember'), 'danger', true);
		});

		return false;
	});

	$('.btn-team-delete').unbind('click').on('click', function linkDeleteHandler(e) {
		e.stopPropagation();
		e.preventDefault();
		const $buttonContext = $(this);

		$deleteTeamModal.appendTo('body').modal('show');
		$deleteTeamModal
			.find('.modal-title')
			.text(
				$t('global.text.sureAboutDeleting', { name: $buttonContext.data('name') }),
			);
		$deleteTeamModal
			.find('.btn-submit')
			.unbind('click')
			.on('click', () => {
				$.ajax({
					url: $buttonContext.attr('href'),
					type: 'DELETE',
					error: function showAJAXError(req, textStatus, errorThrown) {
						$deleteTeamModal.modal('hide');
						if (textStatus === 'timeout') {
							$.showNotification($t('global.text.requestTimeout'), 'warn', 30000);
						} else {
							$.showNotification(errorThrown, 'danger');
						}
					},
					success(result) {
						window.location.href = $buttonContext.attr('redirect');
					},
				});
			});
	});

	initVideoconferencing();
});
