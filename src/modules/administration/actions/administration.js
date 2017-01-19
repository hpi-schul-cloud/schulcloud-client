import { Permissions, Server } from '../../core/helpers/';

const schoolService = Server.service('/schools');
const classService = Server.service('/classes');
const courseService = Server.service('/courses');
const userService = Server.service('/users');


const indexArrayByKey = (array, key) => {
	const result = {};
	array.forEach((obj) => {
		result[obj[key]] = obj;
	});
	return result;
};

export default {
	getCourses: options => {
		const currentUser = Server.get('user');
		const schoolId = currentUser.schoolId;
		return courseService.find({query: Object.assign({}, {schoolId}, options)})
			.then((result) => {
				return Promise.resolve({
					courses: result.data,
					coursesById: indexArrayByKey(result.data, '_id'),
					pagination: {total: result.total, skip: result.skip}
				});
			});
	},

	getClasses: options => {
		const currentUser = Server.get('user');
		const schoolId = currentUser.schoolId;
		classService.find({query: {schoolId: schoolId}}).then((classes) => {
			return Promise.resolve({classes: classes.data, classesById: indexArrayByKey(classes.data, '_id')});
		});
	},
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

	updateUser: (data) => {
		if(data._id) return userService.patch(data._id, data);

		return userService.create(data);
	}
};
