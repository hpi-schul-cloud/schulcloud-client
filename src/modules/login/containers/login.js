import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/login';
import actions from '../actions/login';

import { Server } from '../../core/helpers';



function composer(props, onData) {
	if(Server.get('user')) {
		browserHistory.push('/dashboard/');
		console.info('Already logged in, redirect to dashboard');
		return;
	}
	let componentData = {
		actions
	};

	onData(null, componentData);
}

export default compose(composer)(component);
