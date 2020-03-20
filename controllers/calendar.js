/*
 * One Controller per layout view
 */

const express = require('express');

const router = express.Router();
const moment = require('moment');
const api = require('../api');
const recurringEventsHelper = require('../helpers/recurringEvents');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.get('/', (req, res, next) => {
	const schoolUsesVideoconferencing = (
		res.locals.currentSchoolData.features || []
	).includes('videoconference');
	const showVideoconferenceOption = schoolUsesVideoconferencing;
	res.render('calendar/calendar', {
		title: 'Kalender',
		userId: res.locals.currentUser._id,
		showVideoconferenceOption,
	});
});

router.get('/events/', (req, res, next) => {
	api(req).get('/calendar/', {
		qs: {
			all: true,
		},
	}).then((events) => {
		Promise.all(events.map(event => recurringEventsHelper.mapEventProps(event, req))).then((events) => {
			events = [].concat.apply([], events.map(recurringEventsHelper.mapRecurringEvent));
			return res.json(events);
		});
	}).catch((err) => {
		res.json([]);
	});
});

router.post('/events/', (req, res, next) => {
	req.body.startDate = moment(req.body.startDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();
	req.body.endDate = moment(req.body.endDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();

	if (req.body.courseId && req.body.courseId !== '') {
		req.body.scopeId = req.body.courseId;
	} else {
		delete req.body.courseId;
	}

	if (req.body.teamId && req.body.teamId !== '') {
		req.body.scopeId = req.body.teamId;
	} else {
		delete req.body.teamId;
	}

	api(req).post('/calendar/', { json: req.body }).then(() => {
		res.redirect('/calendar');
	}).catch(next);
});

router.delete('/events/:eventId', (req, res, next) => {
	api(req).delete(`/calendar/${req.params.eventId}`).then((_) => {
		res.json(_);
	}).catch(next);
});

router.put('/events/:eventId', (req, res, next) => {
	req.body.startDate = moment(req.body.startDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();
	req.body.endDate = moment(req.body.endDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();

	api(req).put(`/calendar/${req.params.eventId}`, {
		json: req.body,
	}).then(() => {
		res.redirect('/calendar/');
	}).catch(next);
});

module.exports = router;
