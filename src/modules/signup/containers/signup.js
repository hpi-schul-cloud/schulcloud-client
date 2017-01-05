import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/signup';
import actions from '../actions/signup';

import { Server } from '../../core/helpers';

function composer(props, onData) {
	if(Server.get('user')) {
		browserHistory.push('/dashboard/');
		console.info('Already loggedin, redirect to dashboard');
	} else {

		console.log(props);

		onData(null, {actions});
	}
}

export default compose(composer)(component);
