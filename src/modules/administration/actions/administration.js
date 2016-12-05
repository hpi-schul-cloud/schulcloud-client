import { Permissions, Server } from '../../core/helpers/';

const classService = Server.service('/classes');
const courseService = Server.service('/courses');
const schoolService = Server.service('/schools');
const userService = Server.service('/users');

export default {
	updateSchool: (schoolId, data) => {
		console.log(schoolId, data);
		schoolService.patch(schoolId, data);
	},


	addCourse: (data) => {
		return courseService.create(data);
	},

	removeCourse: (data) => {
		return courseService.remove(data._id);
	},


	addClass: (data) => {
		return classService.create(data);
	},

	removeClass: (data) => {
		return classService.remove(data._id);
	},


	addStudent: (data) => {
		return userService.create(data);
	},

	removeStudent: (data) => {
		return userService.remove(data._id);
	},


	addTeacher: (data) => {
		return userService.create(data);
	},

	removeTeacher: (data) => {
		return userService.remove(data._id);
	}
};
