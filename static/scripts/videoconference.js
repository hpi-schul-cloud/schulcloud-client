/* eslint-disable no-use-before-define */

export const ERROR_MESSAGES = {
	NOT_STARTED_OR_FINISHED: $t('videoconference.text.theVideoConferenceHasEither'),
	NO_PERMISSION: $t('videoconference.text.youDoNotHaveTheNecessaryAuthorization'),
	GENERAL_ERROR: $t('videoconference.text.thereWasAProblemWithTheVideo'),
};

const GuestInactiveState = Object.freeze({
	condition: (permission, state) => permission === 'JOIN_MEETING' && ['NOT_STARTED', 'FINISHED'].includes(state),
	updateUi: (container) => {
		const $reloadButton = $(container).find('i.video-conference.not-started.reload');
		$reloadButton.off('click').on('click', () => {
			$reloadButton.addClass('reload-animation');
			updateVideoconferenceForEvent(container);
			setTimeout(() => { $reloadButton.removeClass('reload-animation'); }, 1000);
		});
		switchVideoconferenceUIState(container, 'not-started');
	},
});

const ModeratorInactiveState = Object.freeze({
	condition: (permission, state) => permission === 'START_MEETING' && ['NOT_STARTED', 'FINISHED'].includes(state),
	updateUi: (container) => {
		$(container).find('a.video-conference.start-conference').off('click').on('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			const event = JSON.parse(container.attributes['data-event'].value);
			const $createVideoconferenceModal = $('.create-videoconference-modal');

			populateModalForm($createVideoconferenceModal, {
				title: $t('videoconference.headline.createVideoConferenceRoom', { name: event.title }),
				closeLabel: $t('global.button.cancel'),
				submitLabel: $t('global.button.create'),
			});

			$createVideoconferenceModal.appendTo('body').modal('show');
			$createVideoconferenceModal.off('submit').on('submit', (ev) => {
				ev.preventDefault();

				const everyAttendeJoinsMuted = $createVideoconferenceModal
					.find('[name=startMuted]').is(':checked');
				const moderatorMustApproveJoinRequests = $createVideoconferenceModal
					.find('[name=requestModerator]').is(':checked');
				const everybodyJoinsAsModerator = $createVideoconferenceModal
					.find('[name=everyoneIsModerator]').is(':checked');

				$.ajax({
					type: 'POST',
					url: '/videoconference/',
					contentType: 'application/json',
					dataType: 'json',
					data: JSON.stringify({
						scopeId: event._id,
						scopeName: 'event',
						options: {
							everyAttendeJoinsMuted,
							moderatorMustApproveJoinRequests,
							everybodyJoinsAsModerator,
						},
					}),
				}).done((response) => {
					// todo, the browser may block popups...
					window.location.replace(response.url);
					updateVideoconferenceForEvent(container);
				}).fail(() => {
					$.showNotification(ERROR_MESSAGES.GENERAL_ERROR, 'danger');
					updateVideoconferenceForEvent(container);
				});
				$createVideoconferenceModal.modal('hide');
			});
		});
		switchVideoconferenceUIState(container, 'start-conference');
	},
});

const RunningState = Object.freeze({
	condition: (permission, state) => state === 'RUNNING',
	updateUi: (container) => {
		$(container).find('a.video-conference.join-conference').off('click').on('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			joinConference(container);
		});
		switchVideoconferenceUIState(container, 'join-conference');
	},
});

const ForbiddenState = Object.freeze({
	condition: permission => !permission,
	updateUi: (container) => {
		switchVideoconferenceUIState(container, 'no-permission');
	},
});

export const STATES = Object.freeze({
	GuestInactiveState, ModeratorInactiveState, RunningState, ForbiddenState,
});
export const STATELIST = [GuestInactiveState, ModeratorInactiveState, RunningState, ForbiddenState];

function updateVideoconferenceForEvent(container) {
	const event = JSON.parse(container.attributes['data-event'].value);
	const eventId = event._id;
	$.ajax({
		type: 'GET',
		url: `/videoconference/event/${eventId}`,
	}).done((res) => {
		const { permission, state } = res;
		STATELIST.forEach((uiState) => {
			if (uiState.condition(permission, state)) {
				uiState.updateUi(container);
			}
		});
	}).fail((err) => {
		if (err.status === 403) {
			ForbiddenState.updateUi(container);
		} else {
			// eslint-disable-next-line no-console
			console.error(err);
		}
	});
}

function joinConference(container) {
	const event = JSON.parse(container.attributes['data-event'].value);
	$.ajax({
		type: 'POST',
		url: '/videoconference/',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
			scopeId: event._id,
			scopeName: 'event',
			options: {},
		}),
	}).done((res) => {
		window.location.replace(res.url);
	}).fail((err) => {
		// eslint-disable-next-line no-console
		console.error(err);
		$.showNotification(ERROR_MESSAGES.GENERAL_ERROR, 'danger');
		updateVideoconferenceForEvent(container);
	});
}

function switchVideoconferenceUIState(container, state) {
	$(container).find('.video-conference').hide();
	$(container).find(`.video-conference.${state}`).show();
}

export function initVideoconferencing() {
	const videoconferenceEvents = Array.from($('div[data-event]'))
		.map(div => [div, JSON.parse(div.attributes['data-event'].value)])
		.filter(tuple => tuple[1].attributes['x-sc-featurevideoconference'] === true);

	videoconferenceEvents.forEach(([container]) => updateVideoconferenceForEvent(container));

	$('i.fa-info-circle.video-conference.not-started').click((e) => {
		e.stopPropagation();
		e.preventDefault();

		const $updateConferenceStatusModal = $('.reload-info-modal');
		populateModalForm($updateConferenceStatusModal, {
			title: '',
			closeLabel: $t('global.button.ok'),
		});

		$updateConferenceStatusModal.appendTo('body').modal('show');
	});

	$('i.fa-info-circle.video-conference.no-permission').click((e) => {
		e.stopPropagation();
		e.preventDefault();

		const $forbiddenModal = $('.forbidden-info-modal');
		populateModalForm($forbiddenModal, {
			title: '',
			closeLabel: $t('global.button.ok'),
		});

		$forbiddenModal.appendTo('body').modal('show');
	});
}
