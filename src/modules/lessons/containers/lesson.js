
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/lesson';
import actions from '../actions/lesson';

const composer = (props, onData) => {

	let componentData = {
		actions
	};

	onData(null, componentData);
};

export default compose(composer)(component);
