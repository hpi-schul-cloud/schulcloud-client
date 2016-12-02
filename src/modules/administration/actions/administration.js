import { Permissions, Server } from '../../core/helpers/';

const classService = Server.service('/class');
const courseService = Server.service('/course');
const schoolService = Server.service('/schools');

export default {
	updateSchool: (schoolId, data) => {
		console.log(schoolId, data);
		schoolService.patch(schoolId, data);
	},

	addCourse: (data) => {
		return courseService.create(data);
	},

	addClass: (data) => {
		return classService.create(data);
	}
};
