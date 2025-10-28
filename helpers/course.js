const api = require('../api');

const isLockedCourse = (course) => !course.teacherIds || course.teacherIds.length === 0;

const getCourse = async (req, courseId) => {
	const course = await api(req).get(`/courses/${courseId}`);
	return course;
};

const checkLockedCourse = async (req, courseId) => {
	const course = await getCourse(null, courseId);
	return isLockedCourse(course);
};

const authorizeLockedCourse = async (req, res, next, courseId) => {
	if (courseId) {
		const locked = await checkLockedCourse(req, courseId);
		if (locked) {
			const error = new Error(res.$t('global.text.403'));
			error.status = 403;
			return next(error);
		}
	}
	return next();
};

const preventCourseLocked = async (req, res, next) => {
	if (req.params && req.params.courseId) {
		return authorizeLockedCourse(req, res, next, req.params.courseId);
	}
	if (req.body && req.body.courseId) {
		return authorizeLockedCourse(req, res, next, req.body.courseId);
	}
	return next();
};

module.exports = {
	checkLockedCourse,
	preventCourseLocked,
};
