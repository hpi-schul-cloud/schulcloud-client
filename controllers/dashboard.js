/*
 * One Controller per layout view
 */

const express = require('express');
const logger = require('../helpers/logger');

const router = express.Router();
const moment = require('moment');
const authHelper = require('../helpers/authentication');
const api = require('../api');

moment.locale('de');
const recurringEventsHelper = require('../helpers/recurringEvents');

const { error, warn } = require('../helpers/logger');

// secure routes
router.use(authHelper.authChecker);

const filterRequestInfos = (err) => {
	if (!err) {
		return err;
	}
	if (err.options && err.options.headers) {
		delete err.options.headers.Authorization;
	}
	delete err.cause;
	delete err.response;
	delete err.request;
	return err;
};

router.get('/', (req, res, next) => {
	// we display time from 7 a.m. to 5 p.m.
	const timeStart = 7;
	const timeEnd = 17;
	const numHours = timeEnd - timeStart;
	const numMinutes = numHours * 60;
	const hours = [];

	for (let j = 0; j <= numHours; j += 1) {
		hours.push(j + timeStart);
	}
	const start = new Date();
	start.setUTCHours(timeStart, 0, 0, 0);
	const end = new Date();
	end.setUTCHours(timeEnd, 0, 0, 0);

	const currentTime = new Date();
	// eslint-disable-next-line max-len
	const currentTotalMinutes = ((currentTime.getHours() - timeStart) * 60) + currentTime.getMinutes();
	let currentTimePercentage = 100 * (currentTotalMinutes / numMinutes);
	if (currentTimePercentage < 0) currentTimePercentage = 0;
	else if (currentTimePercentage > 100) currentTimePercentage = 100;

	const eventsPromise = api(req)
		.get('/calendar/', {
			qs: {
				all: 'true', // lets show all dates in dashboard
				from: start.toLocalISOString(),
				until: end.toLocalISOString(),
			},
		})
		.then((eve) => Promise.all(
			eve.map((event) => recurringEventsHelper.mapEventProps(event, req)),
		))
		.then((evnts) => {
			const mappedEvents = evnts.map(recurringEventsHelper.mapRecurringEvent);
			const flatEvents = [].concat(...mappedEvents);
			const events = flatEvents.filter((event) => {
				const eventStart = new Date(event.start);
				const eventEnd = new Date(event.end);

				return eventStart > start && eventEnd < end;
			});

			return (events || []).map((event) => {
				const eventStart = new Date(event.start);
				let eventEnd = new Date(event.end);

				// cur events that are too long
				if (eventEnd > end) {
					eventEnd = end;
					event.end = eventEnd.toLocalISOString();
				}

				// subtract timeStart so we can use these values for left alignment
				const eventStartRelativeMinutes = ((eventStart.getUTCHours() - timeStart) * 60) + eventStart.getMinutes();
				const eventEndRelativeMinutes = ((eventEnd.getUTCHours() - timeStart) * 60) + eventEnd.getMinutes();
				const eventDuration = eventEndRelativeMinutes - eventStartRelativeMinutes;

				event.comment = `${moment.utc(eventStart).format('kk:mm')} - ${moment.utc(eventEnd).format('kk:mm')}`;
				event.style = {
					left: 100 * (eventStartRelativeMinutes / numMinutes), // percent
					width: 100 * (eventDuration / numMinutes), // percent
				};

				if (event && (!event.url || event.url === '')) {
					// add team or course url to event, otherwise just link to the calendar
					try {
						if (event.hasOwnProperty('x-sc-courseId')) {
							// create course link
							event.url = `/courses/${event['x-sc-courseId']}`;
							event.alt = res.$t('dashboard.img_alt.showCourse');
						} else if (event.hasOwnProperty('x-sc-teamId')) {
							// create team link
							event.url = `/teams/${event['x-sc-teamId']}/?activeTab=events`;
							event.alt = res.$t('dashboard.img_alt.showAppointmentInTeam');
						} else {
							event.url = '/calendar';
							event.alt = res.$t('dashboard.img_alt.showCalendar');
						}
					} catch (err) {
						error(filterRequestInfos(err));
					}
				}

				return event;
			});
		})
		.catch((err) => {
			error(filterRequestInfos(err));
			return [];
		});

	const { _id: userId, schoolId } = res.locals.currentUser;
	const homeworksPromise = api(req)
		.get('/homework/', {
			qs: {
				$populate: ['courseId'],
				$sort: 'createdAt',
				archived: { $ne: userId },
				schoolId,
				$or: [
					{
						dueDate: null,
					},
					{
						dueDate: {
							// homeworks with max. 7 days after and 1 year before dueDate
							$gte: new Date().getTime() - 1000 * 60 * 60 * 24 * 7,
							$lte: new Date(
								new Date().setFullYear(new Date().getFullYear() + 1),
							),
						},
					},
				],
			},
		})
		.then((data) => data.data.map((homeworks) => {
			homeworks.secondaryTitle = homeworks.dueDate
				? moment(homeworks.dueDate).fromNow()
				: res.$t('dashboard.text.noDueDate');
			if (homeworks.courseId != null) {
				homeworks.title = `[${homeworks.courseId.name}] ${homeworks.name}`;
				homeworks.background = homeworks.courseId.color;
			} else {
				homeworks.title = homeworks.name;
				homeworks.private = true;
			}
			homeworks.url = `/homework/${homeworks._id}`;
			homeworks.content = homeworks.description;
			return homeworks;
		}))
		.catch((err) => {
			/* eslint-disable-next-line max-len */
			logger.error(
				`Can not fetch data from /homework/ in router.all("/") | message: ${err.message} | code: ${err.code}.`,
			);
			return [];
		});

	function sortFunction(a, b) {
		if (a.displayAt === b.displayAt) {
			return 0;
		}

		return a.displayAt < b.displayAt ? 1 : -1;
	}
	// Somehow $lte doesn't work in normal query so I manually put it into a request
	const newsPromise = api(req)
		.get('/news/', {
			qs: {
				schoolId: res.locals.currentSchool,
				displayAt: {
					$lte: new Date().getTime(),
				},
			},
		})
		.then((news) => news.data
			.map((n) => {
				n.url = `/news/${n._id}`;
				n.secondaryTitle = moment(n.displayAt).fromNow();
				return n;
			})
			.sort(sortFunction)
			.slice(0, 3))
		.catch((err) => {
			/* eslint-disable-next-line max-len */
			logger.error(
				`Can not fetch data from /news/ in router.all("/") | message: ${err.message} | code: ${err.code}.`,
			);
			return [];
		});

	const newestReleasePromise = api(req)
		.get('/releases', {
			qs: {
				$limit: 1,
				$sort: {
					createdAt: -1,
				},
			},
		})
		.then(({ data }) => data)
		.catch((err) => {
			/* eslint-disable-next-line max-len */
			logger.error(
				`Can not fetch data from /releases in router.all("/") | message: ${err.message} | code: ${err.code}.`,
			);
			return [];
		});

	Promise.all([
		eventsPromise,
		homeworksPromise,
		newsPromise,
		newestReleasePromise,
	])
		.then(([events, assignedHomeworks, news, newestReleases]) => {
			assignedHomeworks.sort((a, b) => {
				if (a.dueDate > b.dueDate || !a.dueDate) {
					return 1;
				}
				return -1;
			});

			const user = res.locals.currentUser || {};
			const userPreferences = user.preferences || {};
			const newestRelease = newestReleases[0] || {};
			const newRelease = !!(
				Date.parse(userPreferences.releaseDate)
			< Date.parse(newestRelease.createdAt)
			);
			const roles = user.roles.map((role) => role.name);
			let homeworksFeedbackRequired = [];
			let homeworksWithFeedback = [];
			let studentHomeworks;
			let filteredAssignedHomeworks;

			const teacher = ['teacher', 'demoTeacher'];
			const student = ['student', 'demoStudent'];

			const hasRole = (allowedRoles) => roles.some((role) => (allowedRoles || []).includes(role));

			if (newRelease || !userPreferences.releaseDate) {
				api(req)
					.patch(`/users/${user._id}`, {
						json: { 'preferences.releaseDate': newestRelease.createdAt },
					})
					.catch(() => {
						warn('failed to update user preference releaseDate');
					});
			}

			let displayDataprivacyAlert = false;
			if (userPreferences.data_privacy_incident_note_2020_01_should_be_displayed
				&& !userPreferences.data_privacy_incident_note_2020_01_was_displayed) {
				api(req)
					.patch(`/users/${user._id}`, {
						json: { 'preferences.data_privacy_incident_note_2020_01_was_displayed': Date.now() },
					})
					.catch(() => {
						warn('failed to update user preference releaseDate');
					});
				displayDataprivacyAlert = true;
			}

			if (hasRole(teacher)) {
				homeworksFeedbackRequired = assignedHomeworks.filter(
					(homework) => !homework.private
					&& homework.stats
					&& (
						(homework.dueDate
						&& new Date(homework.dueDate) < new Date().getTime()
						&& homework.stats.submissionCount > homework.stats.gradeCount
						) || (
							!homework.dueDate && homework.stats.submissionCount > 0
						)
					)
					&& homework.stats.userCount > homework.stats.gradeCount,
				);
				filteredAssignedHomeworks = assignedHomeworks.filter(
					(homework) => homework.stats
				&& homework.stats.submissionCount < homework.stats.userCount,
				);
			}

			if (hasRole(student)) {
				homeworksWithFeedback = assignedHomeworks.filter(
					(homework) => !homework.private && homework.hasEvaluation,
				);
				studentHomeworks = assignedHomeworks.filter(
					(homework) => (!homework.submissions || homework.submissions === 0)
				&& !homework.hasEvaluation,
				);
			}

			res.render('dashboard/dashboard', {
				title: res.$t('dashboard.headline.title'),
				events: events.reverse(),
				eventsDate: moment().format('dddd, DD. MMMM YYYY'),
				assignedHomeworks: (studentHomeworks || filteredAssignedHomeworks || assignedHomeworks)
					.filter(
						(task) => !task.private
					&& (new Date(task.dueDate) >= new Date().getTime() || !task.dueDate),
					).slice(0, 10),
				privateHomeworks: assignedHomeworks
					.filter((task) => task.private)
					.slice(0, 10),
				homeworksFeedbackRequired: homeworksFeedbackRequired.slice(0, 10),
				homeworksWithFeedback: homeworksWithFeedback.slice(0, 10),
				news,
				hours,
				currentTimePercentage,
				showNewReleaseModal: newRelease,
				currentTime: moment(currentTime).format('HH:mm'),
				isTeacher: hasRole(teacher),
				isStudent: hasRole(student),
				displayDataprivacyAlert,
			});
		})
		.catch(next);
});

module.exports = router;
