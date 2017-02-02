import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/calendar';

const composer = (props, onData) => {
	let view = location.hash.replace('#', '');
	if(!['month','agendaWeek','agendaDay'].includes(view)) {
		view = 'month';
	}

	let componentData = {
		events: [],
		view
	};

	onData(null, componentData);
};

export default compose(composer)(component);
