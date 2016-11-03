
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/home';
import actions from '../actions/home';

const composer = (props, onData) => {
	onData(null, {
		actions
	});
};

export default compose(composer)(component);
