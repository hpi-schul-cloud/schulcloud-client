import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { Permissions, Server } from '../../core/helpers/';

import { SubsManager } from 'feathers-subscriptions-manager';

const schoolService = Server.service('/schools');
const courseService = Server.service('/courses');
const classService = Server.service('/classes');
const userService = Server.service('/users');

import component from '../components/administration';
import actions from '../actions/administration';

const composer = (props, onData) => {
	const schoolId = "582c58c72038900b2b7010a8";  // TODO: no _id

	const subManager = new SubsManager();

	subManager.addSubscription(schoolService.get(schoolId), 'school');

	subManager.addSubscription(courseService.find({query: {schoolId: schoolId}}), (courses) => {
		return {courses: courses.data};
	});

	subManager.addSubscription(classService.find({query: {schoolId: schoolId}}), (classes) => {
		return {classes: classes.data};
	});

	subManager.addSubscription(userService.find({
		query: {roles: ['583ead19ee1321739414d3d9']},  // TODO: no _id
		rx: {
			listStrategy: 'always',
				idField: '_id',
				matcher: query => item => {
				return (item.roles || []).includes('583ead19ee1321739414d3d9');  // TODO: no _id
			}
		}
	}), (teachers) => {
		return {teachers: teachers.data};
	});

	subManager.addSubscription(userService.find({
		query: {roles: ['583ead19ee1321739414d3db']},   // TODO: no _id
		rx: {
			listStrategy: 'always',
			idField: '_id',
			matcher: query => item => {
				return (item.roles || []).includes('583ead19ee1321739414d3db');   // TODO: no _id
			}
		}
	}), (students) => {
		return {students: students.data};
	});

	subManager.ready((data, initial) => {
		const componentData = Object.assign({}, {actions}, data);
		onData(null, componentData);
	});

};

export default compose(composer)(component);
