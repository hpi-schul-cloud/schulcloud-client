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

	calendarService.find().then(data => {
		const events = data.map(event => {
			return {
				id: event.id,
				title: event.summary,
				start: event.dtstart,
				end: event.dtend,
				cancelled: event.cancelled,
				//url: '',

				/* custom */
				description: event.description,
				location: event.location,
			}
		});

		let componentData = {
			events,
			view
		};

		onData(null, componentData);
	});
};

export default compose(composer)(component);
