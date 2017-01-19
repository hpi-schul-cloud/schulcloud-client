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

const pluckArrayToObject = (array, key) => {
	const result = {};
	array.forEach((obj) => {
		result[obj[key]] = obj;
	});
	return result;
};

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

	const subsManager = new SubsManager();

	subsManager.addSubscription(schoolService.get(schoolId), 'school');

	subsManager.addSubscription(courseService.find({query: {schoolId: schoolId}}), (courses) => {
		return {courses: courses.data, coursesById: pluckArrayToObject(courses.data, '_id')};
	});

	subsManager.addSubscription(classService.find({query: {schoolId: schoolId}}), (classes) => {
		return {classes: classes.data, classesById: pluckArrayToObject(classes.data, '_id')};
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
		return {teachers: teachers.data, teachersById: pluckArrayToObject(teachers.data, '_id')};
	});

	subsManager.addSubscription(userService.find({
		query: {roles: ['student']},
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
		return {students: students.data, studentsById: pluckArrayToObject(students.data, '_id')};
	});

	subsManager.ready((data, initial) => {
		const componentData = Object.assign({}, {actions, schoolId}, data);
		onData(null, componentData);
	});

};

export default compose(composer)(component);
