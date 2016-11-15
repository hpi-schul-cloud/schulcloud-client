import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/file-explorer';
import actions from '../actions/file-explorer';

const composer = (props, onData) => {

	let componentData = {
		actions
	};

	onData(null, componentData);
};

export default compose(composer)(component);
