import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/fileExplorer';
import actions from '../actions/fileExplorer';

const composer = (props, onData) => {

	let componentData = {
		actions
	};

	onData(null, componentData);
};

export default compose(composer)(component);
