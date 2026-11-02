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
	res.render('calendar/calendar', {
		title: res.$t('calendar.headline.calendar'),
		userId: res.locals.currentUser._id,
	});
});

router.get('/events/', (req, res, next) => {
	return api(req).get('/calendar/', {
		qs: {
			all: true,
			admin: false,
		},
	}).then((events) => {
		const visibleEvents = events.filter((event) => !event['x-sc-teamId'] && !event['x-sc-teamid']);
		return Promise.all(visibleEvents.map((event) => recurringEventsHelper.mapEventProps(event, req))).then(() => {
			// TODO: fix next line
			// eslint-disable-next-line prefer-spread
			const convertedEvents = [].concat.apply([], visibleEvents.map(recurringEventsHelper.mapRecurringEvent));
			return res.json(convertedEvents);
		});
	}).catch(() => {
		res.json([]);
	});
});

router.post('/events/', (req, res, next) => {
	if (req.body.teamId || req.body['x-sc-teamId'] || req.body['x-sc-teamid']) {
		return res.sendStatus(404);
	}
	delete req.body.teamId;
	delete req.body['x-sc-teamId'];
	delete req.body['x-sc-teamid'];

	// eslint-disable-next-line no-underscore-dangle
	req.body.startDate = timesHelper.dateTimeStringToMoment(req.body.startDate)
		.toISOString(true);
	// eslint-disable-next-line no-underscore-dangle
	req.body.endDate = timesHelper.dateTimeStringToMoment(req.body.endDate)
		.toISOString(true);

	if (req.body.courseId && req.body.courseId !== '') {
		req.body.scopeId = req.body.courseId;
	} else {
		delete req.body.courseId;
	}

	return api(req).post('/calendar/', { json: req.body }).then(() => {
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
	req.body.startDate = timesHelper.dateTimeStringToMoment(req.body.startDate)
		.toISOString(true);
	// eslint-disable-next-line no-underscore-dangle
	req.body.endDate = timesHelper.dateTimeStringToMoment(req.body.endDate)
		.toISOString(true);

	api(req).put(`/calendar/${req.params.eventId}`, {
		json: req.body,
	}).then(() => {
		res.redirect('/calendar/');
	}).catch(next);
});

module.exports = router;
