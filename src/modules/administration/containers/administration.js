import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { Permissions, Server } from '../../core/helpers/';

import { SubsManager } from 'feathers-subscriptions-manager';

import permissions from '../permissions';
const schoolService = Server.service('/schools');
const courseService = Server.service('/courses');
const classService = Server.service('/classes');
const userService = Server.service('/users');
const roleService = Server.service('/roles');

import component from '../components/administration';
import actions from '../actions/administration';

const composer = (props, onData) => {

	const currentUser = Server.get('user');

	if(!Permissions.userHasPermission(currentUser, permissions.VIEW)) {
		onData(new Error('You don\'t have the permission to see this page.'));
		return;
	}

	const schoolId = currentUser.schoolId;

	if(!schoolId) {
		return onData(new Error("The current user is not associated with a school"));
	}

	// bind the schoolId parameter for cleaner calls in the components
	actions.loadTeachers = actions._loadTeachers.bind(undefined, schoolId);
	actions.loadClasses = actions._loadClasses.bind(undefined, schoolId);

	Server.service('/schools').get(schoolId)
		.then(school => {
			const componentData = {actions, schoolId, school};
			onData(null, componentData);
		})
		.catch(error => onData(error));
};

export default compose(composer)(component);
