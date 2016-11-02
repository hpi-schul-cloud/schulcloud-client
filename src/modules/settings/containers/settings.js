import React from 'react';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/settings';
import actions from '../actions/settings';

const composer = (props, onData) => {

	let componentData = {
		actions
	};

	onData(null, componentData);
};

export default compose(composer)(component);
