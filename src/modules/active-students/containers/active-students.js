
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/active-students';
import actions from '../actions/active-students';

const composer = (props, onData) => {
	let componentData = {
		actions
	};

	onData(null, componentData);
};

export default compose(composer)(component);

