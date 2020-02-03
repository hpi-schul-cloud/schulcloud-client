/* eslint-disable no-use-before-define */

const GuestInactiveState = Object.freeze({
	condition: (permission, state) => permission === 'JOIN_MEETING' && ['NOT_STARTED', 'FINISHED'].includes(state),
	updateUi: (container) => {
		console.log($(container).find('i.video-conference.not-started.reload'));
		$(container).find('i.video-conference.not-started.reload').off('click').on('click', (e) => {
			updateVideoconferenceForEvent(container);
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
				title: `Videokonferenzraum "${event.title}" erstellen`,
				closeLabel: 'Abbrechen',
				submitLabel: 'Erstellen',
			});

			$createVideoconferenceModal.appendTo('body').modal('show');
			$createVideoconferenceModal.off('submit').on('submit', (ev) => {
				ev.preventDefault();

				const everyAttendeJoinsMuted = $createVideoconferenceModal.find('[name=startMuted]').is(':checked');
				const moderatorMustApproveJoinRequests = $createVideoconferenceModal.find('[name=requestModerator]').is(':checked');
				const everybodyJoinsAsModerator = $createVideoconferenceModal.find('[name=everyoneIsModerator]').is(':checked');

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
					window.open(response.url, '_blank');
					updateVideoconferenceForEvent(container);
				}).fail((error) => {
					console.error(error);
					$.showNotification('Es gab ein Problem mit der Videokonferenz. Bitte versuche es erneut.', 'danger');
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

export const STATES = Object.freeze({ GuestInactiveState, ModeratorInactiveState, RunningState });
export const STATELIST = [GuestInactiveState, ModeratorInactiveState, RunningState];

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
	}).fail((_, err) => {
		console.error(err);
	});
}

function joinConference(container) {
	const event = JSON.parse(container.attributes['data-event'].value);
	$.post('/videoconference/', {
		scopeId: event._id,
		scopeName: 'event',
		options: {},
	}, (response) => {
		window.open(response.url, '_blank');
	});
}

function switchVideoconferenceUIState(container, state) {
	$(container).find('.video-conference').hide();
	$(container).find(`.video-conference.${state}`).show();
}

export function initVideoconferencing() {
	const videoconferenceEvents = Array.from($('div[data-event]'))
		.map(div => [div, JSON.parse(div.attributes['data-event'].value)])
		.filter(([_, event]) => event.attributes['x-sc-featurevideoconference'] === true);

	videoconferenceEvents.forEach(([container]) => updateVideoconferenceForEvent(container));
}
