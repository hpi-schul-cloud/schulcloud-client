import { Permissions, Server } from '../../core/helpers/';

const schoolService = Server.service('/schools');
const classService = Server.service('/classes');
const courseService = Server.service('/courses');
const userService = Server.service('/users');

export default {
	updateSchool: (data) => {
		if(data._id) return schoolService.patch(data._id, data);

		return schoolService.create(data);
	},


	updateCourse: (data) => {
		if(data._id) return courseService.patch(data._id, data);

		return courseService.create(data);
	},

	removeCourse: (data) => {
		return courseService.remove(data._id);
	},


	updateClass: (data) => {
		if(data._id) return classService.patch(data._id, data);

		return classService.create(data);
	},

	removeClass: (data) => {
		return classService.remove(data._id);
	},


	updateStudent: (data) => {
		if(data._id) return userService.patch(data._id, data);

		return userService.create(data);
	},

	removeStudent: (data) => {
		return userService.remove(data._id);
	},


	updateTeacher: (data) => {
		if(data._id) return userService.patch(data._id, data);

		return userService.create(data);
	},

	removeTeacher: (data) => {
		return userService.remove(data._id);
	},


	updateAdmin: (data) => {
		if(data._id) return userService.patch(data._id, data);

		return userService.create(data);
	}
};
