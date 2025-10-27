const api = require('../api');

const isLockedCourse = (course) => !course.teacherIds || course.teacherIds.length === 0;

const getCourse = async (req, id) => {
	const course = await api(req).get(`/courses/${id}`);
	return course;
};

const preventCourseLocked = async (req, res, next) => {
	if (req.params && req.params.courseId) {
		const course = await getCourse(req, req.params.courseId);
		if (isLockedCourse(course)) {
			const error = new Error(res.$t('global.text.403'));
			error.status = 403;
			return next(error);
		}
	}
	return next();
};

module.exports = {
	preventCourseLocked,
};
