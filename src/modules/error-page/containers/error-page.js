
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/error-page';
import actions from '../actions/error-page';

const composer = (props, onData) => {
	let componentData = {
		actions
	};

	onData(null, componentData);
};

export default compose(composer)(component);

