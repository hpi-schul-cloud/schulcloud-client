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


	updateCourse: (data) => {
		if(data._id) return courseService.update(data._id, data);

		return courseService.create(data);
	},

	removeCourse: (data) => {
		return courseService.remove(data._id);
	},


	updateClass: (data) => {
		if(data._id) return classService.update(data._id, data);

		return classService.create(data);
	},

	removeClass: (data) => {
		return classService.remove(data._id);
	},


	updateStudent: (data) => {
		if(data._id) return userService.update(data._id, data);

		return userService.create(data);
	},

	removeStudent: (data) => {
		return userService.remove(data._id);
	},


	updateTeacher: (data) => {
		if(data._id) return userService.update(data._id, data);

		return userService.create(data);
	},

	removeTeacher: (data) => {
		return userService.remove(data._id);
	}
};
