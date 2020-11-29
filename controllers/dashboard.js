/*
 * One Controller per layout view
 */

const express = require('express');
const logger = require('../helpers/logger');

const router = express.Router();
const authHelper = require('../helpers/authentication');
const { api } = require('../api');
const timesHelper = require('../helpers/timesHelper');

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
	// we display time from 7 to 17
	const timeStart = 7;
	const timeEnd = 17;
	const numHours = timeEnd - timeStart;
	const numMinutes = numHours * 60;
	const hours = [];

	for (let j = 0; j <= numHours; j += 1) {
		hours.push(j + timeStart);
	}
	const start = timesHelper.currentDate();
	start.set({ hour: timeStart, minute: 0, second: 0 });
	const end = timesHelper.currentDate();
	end.set({ hour: timeEnd, minute: 0, second: 0 });

	const currentTime = timesHelper.currentDate();
	// eslint-disable-next-line max-len
	const currentTotalMinutes = ((currentTime.hours() - timeStart) * 60) + currentTime.minutes();
	let currentTimePercentage = 100 * (currentTotalMinutes / numMinutes);
	if (currentTimePercentage < 0) currentTimePercentage = 0;
	else if (currentTimePercentage > 100) currentTimePercentage = 100;

	const eventsPromise = api(req)
		.get('/calendar/', {
			qs: {
				all: 'false', // must set to false to use from and until request
				from: start.toISOString(true),
				until: end.toISOString(true),
			},
		})
		.then((eve) => Promise.all(
			eve.map((event) => recurringEventsHelper.mapEventProps(event, req)),
		))
		.then((evnts) => {
			const mappedEvents = evnts.map(recurringEventsHelper.mapRecurringEvent);
			const flatEvents = [].concat(...mappedEvents);
			const events = flatEvents.filter((event) => {
				const eventStart = timesHelper.fromUTC(event.start);
				const eventEnd = timesHelper.fromUTC(event.end);

				return eventStart.isBefore(end) && eventEnd.isAfter(start);
			});

			return (events || []).map((event) => {
				let eventStart = timesHelper.fromUTC(event.start);
				let eventEnd = timesHelper.fromUTC(event.end);

				// cur events that are too long
				if (eventEnd.isAfter(end)) {
					eventEnd = end;
					event.end = eventEnd.toISOString(true);
				}

				if (eventStart.isBefore(start)) {
					eventStart = start;
					event.start = eventEnd.toISOString(true);
				}

				// subtract timeStart so we can use these values for left alignment
				const eventStartRelativeMinutes = ((eventStart.hours() - timeStart) * 60) + eventStart.minutes();
				const eventEndRelativeMinutes = ((eventEnd.hours() - timeStart) * 60) + eventEnd.minutes();
				const eventDuration = eventEndRelativeMinutes - eventStartRelativeMinutes;

				event.comment = `${timesHelper.formatDate(eventStart, 'kk:mm')}
				- ${timesHelper.formatDate(eventEnd, 'kk:mm', true)}`;
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
			}).sort((a, b) => b.style.left - a.style.left);
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
							$gte: timesHelper.currentDate().add(-7, 'days').format('x'),
							$lte: timesHelper.currentDate()
								.add(1, 'years')
								.set({ hour: 23, minute: 59, second: 59 })
								.format('x'),
						},
					},
				],
			},
		})
		.then((data) => data.data.map((homeworks) => {
			homeworks.secondaryTitle = homeworks.dueDate
				? timesHelper.fromNow(homeworks.dueDate)
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

	// Somehow $lte doesn't work in normal query so I manually put it into a request
	const newsPromise = api(req)
		.get('/news/', {
			qs: {
				schoolId: res.locals.currentSchool,
				displayAt: {
					$lte: timesHelper.now(),
				},
				sort: '-displayAt',
				$limit: 3,
			},
		})
		.then((news) => news.data
			.map((n) => {
				n.url = `/news/${n._id}`;
				n.secondaryTitle = timesHelper.fromNow(n.displayAt);
				return n;
			}))
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
								&& timesHelper.fromUTC(homework.dueDate).isBefore(timesHelper.currentDate())
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
				eventsDate: timesHelper.currentDate().format(timesHelper.FORMAT.dateLong),
				assignedHomeworks: (studentHomeworks || filteredAssignedHomeworks || assignedHomeworks)
					.filter(
						(task) => !task.private
							&& (
								timesHelper.fromUTC(task.dueDate).isSameOrAfter(timesHelper.currentDate())
								|| !task.dueDate
							),
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
				currentTime: timesHelper.fromUTC(currentTime).format('HH:mm'),
				isTeacher: hasRole(teacher),
				isStudent: hasRole(student),
				displayDataprivacyAlert,
			});
		})
		.catch(next);
});

module.exports = router;
