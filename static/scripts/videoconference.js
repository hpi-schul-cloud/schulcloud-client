
const GuestInactiveState = Object.freeze({
	condition: (permission, state) => permission === 'JOIN_MEETING' && (state === 'NOT_STARTED' || state === 'FINISHED'),
	updateUi: (container) => {
		container.find('.video-conference.not-started#reload').off('click').on('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			updateVideoconferenceForEvent(container);
		})
		switchVideoconferenceUIState(container, 'not-started');
	}
});

const ModeratorInactiveState = Object.freeze({
	condition: (permission, state) => permission === 'START_MEETING' && (state === 'NOT_STARTED' || state === 'FINISHED'),
	updateUi: (container) => {
		switchVideoconferenceUIState(container, 'start-conference');
	}
});

const RunningState = Object.freeze({
	condition: (permission, state) => state === 'RUNNING',
	updateUi: (container) => {
		container.find('a.video-conference.join-conference').off('click').on('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			joinConference(container);
		});
		switchVideoconferenceUIState(container, 'join-conference');
	}
});

export const STATES = Object.freeze({ GuestInactiveState, ModeratorInactiveState, RunningState });
export const STATELIST = [GuestInactiveState, ModeratorInactiveState, RunningState];


export function initVideoconferencing() {
	const videoconferenceEvents = Array.from($('div[data-event]'))
		.map((div) => [div, JSON.parse(div.attributes['data-event'].value)])
		.filter(([_, event]) => event.attributes['x-sc-featurevideoconference'] === true);
	
	videoconferenceEvents.forEach(([container]) => updateVideoconferenceForEvent(container));
}

function updateVideoconferenceForEvent(container) {
	const event = JSON.parse(container.attributes['data-event'].value);
	const eventId = event['_id'];
	$.ajax({
		type: 'GET',
		url: `/videoconference/event/${eventId}`,
	}).done((res) => {
		const { permission, state } = res;
		const $container = $(container);
		STATELIST.forEach((uiState) => {
			if (uiState.condition(permission, state)) {
				uiState.updateUi($container);
			}
		});
	}).fail((_, err) => {
		console.error(err);
	});
}

function joinConference(container) {
	const event = JSON.parse(container.attributes['data-event'].value);
	$.post('/videoconference/', {
		scopeId: event['_id'],
		scopeName: 'event',
		options: {},
	}, (response) => {
		window.open(response.url, '_blank');
	});
}

function switchVideoconferenceUIState(container, state) {
	container.find('.video-conference').hide();
	container.find('.video-conference.' + state).show();
}
