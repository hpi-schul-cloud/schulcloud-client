const express = require('express');

const router = express.Router();

const checkIfUserIsTeacher = (req, res, next) => {
	if (req.user && req.user.role === 'teacher') {
		req.isTeacher = true;
	} else {
		req.isTeacher = false;
	}
	next();
};

router.use('topic/edit-topic', checkIfUserIsTeacher);

module.exports = checkIfUserIsTeacher;
