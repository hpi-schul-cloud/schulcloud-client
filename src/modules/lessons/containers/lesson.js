import {browserHistory} from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import { Permissions, Server } from '../../core/helpers/';

import permissions from '../permissions';
import component from '../components/lesson';
import actions from '../actions/lesson';

const composer = (props, onData) => {
	const currentUser = Server.get('user');
	if(Permissions.userHasPermission(currentUser, permissions.VIEW)) {
		let componentData = {
			actions
		};

		onData(null, componentData);
	} else {
		onData(new Error('You don\'t have the permission to see this page.'));
	}
};

export default compose(composer)(component);
