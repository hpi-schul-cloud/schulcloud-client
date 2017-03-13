import {render} from 'react-dom';
import {compose} from 'react-komposer';

import { Server } from '../../core/helpers/';

import component from '../components/calendar';

const calendarService = Server.service('/calendar');

const composer = (props, onData) => {
	let view = location.hash.replace('#', '');
	if(!['month','agendaWeek','agendaDay'].includes(view)) {
		view = 'month';
	}

	let error;
	const getEvents = new Promise((resolve, reject) => {
		calendarService
			.find()
			.then(events => resolve(events))
			.catch(err => {
				error = err;
				resolve([]);
			}); // prevent calendar from not loading if calendar service is down
	});

	getEvents.then(events => {
		events = events.map(event => {
			return {
				id: event.id,
				title: event.summary,
				start: event.dtstart,
				end: event.dtend,
				cancelled: event.cancelled,

				/* custom */
				description: event.description,
				location: event.location,
			};
		});

		let componentData = {
			error,
			events,
			view
		};

		onData(null, componentData);
	});
};

export default compose(composer)(component);
