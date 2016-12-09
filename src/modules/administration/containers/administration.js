import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { Permissions, Server } from '../../core/helpers/';

import { SubsManager } from 'feathers-subscriptions-manager';

const schoolService = Server.service('/schools');
const courseService = Server.service('/courses');
const classService = Server.service('/classes');
const userService = Server.service('/users');
const roleService = Server.service('/roles');

import component from '../components/administration';
import actions from '../actions/administration';

const composer = (props, onData) => {
	const schoolId = "582c58c72038900b2b7010a8";  // TODO: no _id

	const subsManager = new SubsManager();

	subsManager.addSubscription(schoolService.get(schoolId), 'school');

	subsManager.addSubscription(courseService.find({query: {schoolId: schoolId}}), (courses) => {
		return {courses: courses.data};
	});

	subsManager.addSubscription(classService.find({query: {schoolId: schoolId}}), (classes) => {
		return {classes: classes.data};
	});

	subsManager.addSubscription(userService.find({
		query: {
			roles: ['teacher'],
			$populate: ['roles']
		},
		rx: {
			listStrategy: 'always',
			idField: '_id',
			matcher: query => item => {
				// TODO: this should work out of the box - looks like a bug in the feathers-reactive module
				return roleService.find({
					query: {
						_id: {
							$in: item.roles || []
						}
					}
				}).then((response) => {
					return response.data.map(r => r.name).includes('teacher');
				});
			}
		}
	}), (teachers) => {
		return {teachers: teachers.data};
	});

	subsManager.addSubscription(userService.find({
		query: {roles: ['student']},   // TODO: no _id
		rx: {
			listStrategy: 'always',
			idField: '_id',
			matcher: query => item => {
				// TODO: this should work out of the box - looks like a bug in the feathers-reactive module
				return roleService.find({
					query: {
						_id: {
							$in: item.roles || []
						}
					}
				}).then((response) => {
					return response.data.map(r => r.name).includes('student');
				});
			}
		}
	}), (students) => {
		return {students: students.data};
	});

	subsManager.ready((data, initial) => {
		const componentData = Object.assign({}, {actions}, data);
		onData(null, componentData);
	});

};

export default compose(composer)(component);
