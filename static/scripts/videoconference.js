
const GuestInactiveState = Object.freeze({
	condition: (permission, state) => permission === 'JOIN_MEETING' && (state === 'NOT_STARTED' || state === 'FINISHED'),
});

const ModeratorInactiveState = Object.freeze({
	condition: (permission, state) => permission === 'START_MEETING' && (state === 'NOT_STARTED' || state === 'FINISHED'),
});

const RunningState = Object.freeze({
	condition: (permission, state) => state === 'RUNNING',
});

export const STATES = Object.freeze({ GuestInactiveState, ModeratorInactiveState, RunningState });
