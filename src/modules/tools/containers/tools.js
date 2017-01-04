import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { SubsManager } from 'feathers-subscriptions-manager';

import { Permissions, Server } from '../../core/helpers/';

import permissions from '../permissions';
import component from '../components/tools';
import actions from '../actions/tools';

const toolsService = Server.service('/ltiTools');
const coursesService = Server.service('/courses');

function composer(props, onData) {

	const currentUser = Server.get('user');

	if(!Permissions.userHasPermission(currentUser, permissions.VIEW)) {
		onData(new Error('You don\'t have the permission to see this page.'));
		return;
	}

	// get just tools for the user's courses
	coursesService.find({
		query: {
			$or: [{teacherIds: currentUser._id}, {userIds: currentUser._id}],
			$populate: ['ltiToolIds']
		}
	}).then(result => {
		let courses = result.data;
		let tools = [].concat.apply([], courses.map(c => {
			return c.ltiToolIds.filter(t => {
				return !t.isTemplate;
			});
		}));
		let componentData = {
			actions,
			tools: tools
		};
		onData(null, componentData);
	}).catch(err => {
		onData(err);
	});
}

export default compose(composer)(component);
