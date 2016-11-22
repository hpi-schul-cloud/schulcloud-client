import {browserHistory} from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import { Permissions, Server } from '../../core/helpers/';

import permissions from '../permissions';
import component from '../components/dashboard';
import actions from '../actions/dashboard';

const composer = (props, onData) => {
	const currentUser = Server.get('user');
	Permissions.userHasPermission(currentUser, permissions.VIEW)
	.then(() => {
		let componentData = {
			actions
		};

		onData(null, componentData);
	})
	.catch(() => {
		onData(new Error('You don\'t have the permission to see this page.'));
	});
};

export default compose(composer)(component);
