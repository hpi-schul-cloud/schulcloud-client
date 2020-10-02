/*
 * One Controller per layout view
 */

const express = require('express');

const router = express.Router();
const api = require('../api');
const recurringEventsHelper = require('../helpers/recurringEvents');
const timesHelper = require('../helpers/timesHelper');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.get('/', (req, res, next) => {
	const schoolUsesVideoconferencing = (
		res.locals.currentSchoolData.features || []
	).includes('videoconference');
	const showVideoconferenceOption = schoolUsesVideoconferencing;

	res.render('calendar/calendar', {
		title: res.$t('calendar.headline.calendar'),
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
		Promise.all(events.map(event => recurringEventsHelper.mapEventProps(event, req))).then((responseEvents) => {
			// TODO: fix next line
			// eslint-disable-next-line prefer-spread
			const convertedEvents = [].concat.apply([], events.map(recurringEventsHelper.mapRecurringEvent));
			return res.json(convertedEvents);
		});
	}).catch(() => {
		res.json([]);
	});
});

router.post('/events/', (req, res, next) => {
	// eslint-disable-next-line no-underscore-dangle
	req.body.startDate = timesHelper.createFromString(req.body.startDate, 'DD.MM.YYYY HH:mm').toISOString(true);
	// eslint-disable-next-line no-underscore-dangle
	req.body.endDate = timesHelper.createFromString(req.body.endDate, 'DD.MM.YYYY HH:mm').toISOString(true);

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
	api(req).delete(`/calendar/${req.params.eventId}`).then((response) => {
		res.json(response);
	}).catch(next);
});

router.put('/events/:eventId', (req, res, next) => {
	// eslint-disable-next-line no-underscore-dangle
	req.body.startDate = timesHelper.createFromString(req.body.startDate, 'DD.MM.YYYY HH:mm').toISOString(true);
	// eslint-disable-next-line no-underscore-dangle
	req.body.endDate = timesHelper.createFromString(req.body.endDate, 'DD.MM.YYYY HH:mm').toISOString(true);

	api(req).put(`/calendar/${req.params.eventId}`, {
		json: req.body,
	}).then(() => {
		res.redirect('/calendar/');
	}).catch(next);
});

module.exports = router;
