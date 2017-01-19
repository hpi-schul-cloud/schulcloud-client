import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { SubsManager } from 'feathers-subscriptions-manager';

const accountService = Server.service('/accounts');
const schoolService = Server.service('/schools');
import adminActions from '../../administration/actions/administration';

import component from '../components/signup';
import actions from '../actions/signup';

import { Server } from '../../core/helpers';

function composer(props, onData) {
	// admin, teacher, student, student-sso TODO: make secure
	const isSSO = props.params.role.includes('-sso');
	const role = props.params.role.replace('-sso', '');

	let accountId = props.params.accountId;
	let schoolId = props.params.schoolId;

	if(isSSO && !accountId) throw new Error('accountId has to be set if you want to use SSO.');

	const componentData = Object.assign({
		actions: Object.assign({}, adminActions, actions),
		role,
		isSSO,
		schoolId,
		accountId,
		onSignup: (data) => {
			actions.signupUser(data, data.accountId).then((account) => {
				console.log(account);
				return actions.finishSetup(account.userId);
			}).then(() => {
				browserHistory.push('/login/');
			});
		}
	});

	const checkIdPromises = [];
	if(schoolId) checkIdPromises.push(schoolService.get(schoolId));
	if(accountId) checkIdPromises.push(accountService.get(accountId));

	Promise.all(checkIdPromises).then(() => {
		onData(null, componentData);
	}).catch(() => {
		onData(new Error('not authorized', 401));
	});
}

export default compose(composer)(component);
