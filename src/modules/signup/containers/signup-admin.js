import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { SubsManager } from 'feathers-subscriptions-manager';

const schoolService = Server.service('/schools');
import adminActions from '../../administration/actions/administration';

import component from '../components/signup';
import actions from '../actions/signup';

import { Server } from '../../core/helpers';

function composer(props, onData) {

	const step = props.params.step;
	const currentUser = Server.get('user');
	const schoolId = props.params.schoolId;

	// first two steps can't be logged in
	if(currentUser) {
		browserHistory.push('/login/');
		return;
	}

	const componentData = Object.assign({
		actions: Object.assign({}, adminActions, actions),
		step,
		onSignupAdmin: (data) => {
			adminActions.updateAdmin(data).then((admin) => {
				// TODO: Send mail with credentials here
				// TODO: automatically login
				browserHistory.push('/login/');
			});
		}
	});

	schoolService.get(schoolId).then((school) => {
		componentData.school = school;
		onData(null, componentData);
	}).catch(() => {
		onData(new Error('not authorized', 401));
	});
}

export default compose(composer)(component);
