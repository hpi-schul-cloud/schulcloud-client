import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import adminActions from '../../administration/actions/administration';

import component from '../components/signup';
import actions from '../actions/signup';

const combinedActions = Object.assign({}, adminActions, actions);

import { Server } from '../../core/helpers';

const getFormStepComponentData = (step) => {
	switch(step) {
		case 'admin': {
			return {

			};
		}
		case 'school': {
			return {

			};
		}
		case 'teachers': {
			return {
				teachers: [],
				school: {
					_id: "584ad186816abba584714c94"
				}
			};
		}
		case 'classes': {
			return {
				teachers: [],
				classes: [],
				school: {
					_id: "584ad186816abba584714c94"
				}
			};
		}
		case 'courses': {
			return {
				teachers: [],
				classes: [],
				courses: [],
				school: {
					_id: "584ad186816abba584714c94"
				}
			};
		}
		default: {
			return {};
		}
	}
};

function composer(props, onData) {
	if(Server.get('user')) {
		browserHistory.push('/dashboard/');
		console.info('Already loggedin, redirect to dashboard');
	} else {
		console.log(props.params.step);
		const formStepComponentData = getFormStepComponentData(props.params.step);
		onData(null, Object.assign({actions: combinedActions, step: props.params.step}, formStepComponentData));
	}
}

export default compose(composer)(component);
