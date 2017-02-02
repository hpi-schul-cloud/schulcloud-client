import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { SubsManager } from 'feathers-subscriptions-manager';

import adminActions from '../../administration/actions/administration';

import component from '../components/setup';
import actions from '../actions/signup';


import { Server } from '../../core/helpers';

const pluckArrayToObject = (array, key) => {
	const result = {};
	array.forEach((obj) => {
		result[obj[key]] = obj;
	});
	return result;
};


function composer(props, onData) {

	const step = props.params.step;
	const combinedActions = Object.assign({}, adminActions, actions);
	const currentUser = Server.get('user');

	// make sure that only allowed steps here
	if(!['school', 'teachers', 'classes', 'courses'].includes(step)) {
		throw new Error('not found', 404);
	}

	if(!currentUser) {
		browserHistory.push('/login/');
		return;
	}

	if((currentUser.preferences || {}).finishedSignup) {
		browserHistory.push('/dashboard/');
		return;
	}

	const schoolId = currentUser.schoolId;

	const componentData = {
		actions: combinedActions,
		step,
		onUpdateSchool: (data) => {
			actions.updateSchool(data).then(() => {
				browserHistory.push("/setup/teachers/");
			});
		},
		onSignupFinished: () => {
			actions.finishSignup(currentUser._id).then(() => {
				browserHistory.push("/administration/");
			});
		}
	};

	Server.service('/schools').get(schoolId)
		.then(school => {
			Object.assign(componentData, {schoolId, school});
			onData(null, componentData);
		})
		.catch(error => onData(error));

}

export default compose(composer)(component);
