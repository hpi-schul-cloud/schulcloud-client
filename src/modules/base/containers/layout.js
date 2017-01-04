import {browserHistory} from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import { Permissions, Server } from '../../core/helpers/';

import permissions from '../permissions';
import component from '../components/layout';
import actions from '../actions/layout';

const composer = (props, onData) => {
	const currentUser = Server.get('user');
	if(currentUser) {

		if(Permissions.userHasPermission(currentUser, permissions.VIEW)) {
			let componentData = {
				actions
			};

			onData(null, componentData);
		} else {
			onData(new Error('You don\'t have the permission to see this page.'));
		}

	} else {
		browserHistory.push('/login/');

		onData(new Error('Not authorized, redirect to login.'));
	}

};

export default compose(composer)(component);
