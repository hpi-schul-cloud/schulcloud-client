import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/calendar';

const composer = (props, onData) => {

	let componentData = {
		events: []
	};

	onData(null, componentData);
};

export default compose(composer)(component);
