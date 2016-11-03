
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/dashboard';
import actions from '../actions/dashboard';

const composer = (props, onData) => {

	let componentData = {
		actions
	};

	onData(null, componentData);
};

export default compose(composer)(component);
