import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { SubsManager } from 'feathers-subscriptions-manager';

const accountService = Server.service('/accounts');
const userService = Server.service('/users');
const schoolService = Server.service('/schools');
import adminActions from '../../administration/actions/administration';

import component from '../components/signup';
import actions from '../actions/signup';

import { Server } from '../../core/helpers';

function composer(props, onData) {

	let user = {};
	let role = 'student';
	let isSSO = false;
	let accountId = '';
	let schoolId = props.params.schoolId;
	const recordId = props.params.recordId;
	let dataPromises = [];

	if(props.params.idType == 'a') {
		// idType = accountId, used for student sso
		if(!schoolId) {
			throw new Error('schoolId has to be set if you want to use SSO.');
		}

		isSSO = true;
		accountId = recordId;

		// check that IDs are valid
		dataPromises.push(schoolService.get(schoolId));
		dataPromises.push(accountService.get(accountId));
	} else if(props.params.idType == 'u') {
		// idType = userId, used for teacher and admin
		dataPromises.push(userService.get(recordId).then(data => {
			user = data;
			role = user.roles[0];
			schoolId = user.schoolId;
		}));
	} else if(props.params.idType == 's') {
		// idType = schoolId, used for students
		schoolId = recordId;
	}

	Promise.all(dataPromises).then(_ => {
		const componentData = Object.assign({
			actions: Object.assign({}, adminActions, actions),
			role,
			user,
			accountId,
			schoolId,
			isSSO,
			onSignup: data => {
				actions.signupUser(data).then(account => {
					return actions.finishSetup(account.userId);
				}).then(_ => {
					browserHistory.push('/login/');
				});
			}
		});

		onData(null, componentData);
	}).catch(() => {
		onData(new Error('not authorized', 401));
	});
}

export default compose(composer)(component);
