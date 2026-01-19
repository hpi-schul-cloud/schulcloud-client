/*
 * One Controller per layout view
 */

const express = require('express');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { logger } = require('../helpers');

const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');
const timesHelper = require('../helpers/timesHelper');

const recurringEventsHelper = require('../helpers/recurringEvents');
const { SC_THEME } = require('../config/global');

// secure routes
router.use(authHelper.authChecker);

const getCalendarEvents = (req, res, {
	numMinutes, timeStart, start, end,
}) => api(req)
	.get('/calendar/', {
		qs: {
			all: 'false', // must set to false to use from and until request
			from: start.toISOString(true),
			until: end.toISOString(true),
			admin: 'false',
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
						event.url = `/rooms/${event['x-sc-courseId']}`;
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
					logger.error(err);
				}
			}

			return event;
		}).sort((a, b) => b.style.left - a.style.left);
	})
	.catch((err) => {
		logger.error(err);
		return [];
	});

const getTimeOptions = () => {
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

	return {
		hours,
		currentTime,
		currentTimePercentage,
		numMinutes,
		timeStart,
		start,
		end,
	};
};

router.get('/', (req, res, next) => {
	const timeOptions = getTimeOptions();
	const {	hours, currentTime, currentTimePercentage } = timeOptions;

	const show = Configuration.get('CALENDAR_SERVICE_ENABLED') === true
		&& Configuration.get('CALENDAR_DASHBOARD_ENABLED') === true;
	const eventsPromise = show ? getCalendarEvents(req, res, timeOptions) : Promise.resolve([]);

	const mapV3TaskToLegacyHomework = (task) => {
		const homework = {
			_id: task.id,
			name: task.name,
			description: task.description?.content ?? '',
			dueDate: task.dueDate,
			availableDate: task.availableDate,
			courseId: task.courseId ? {
				_id: task.courseId,
				name: task.courseName,
				color: task.displayColor,
			} : null,
			lessonId: {
				hidden: task.lessonHidden,
			},
			stats: {
				userCount: task.status.maxSubmissions,
				submissionCount: task.status.submitted,
				gradeCount: task.status.graded,
			},
			hasEvaluation: task.status.graded > 0,
			submissions: task.status.submitted,
			private: task.status.isDraft,
		};

		return homework;
	};

	const fetchAllTasks = async (skip = 0, limit = 100, accumulatedTasks = []) => {
		const data = await api(req, { version: 'v3' }).get('/tasks/', {
			qs: {
				limit,
				skip,
			},
		});

		const allTasks = accumulatedTasks.concat(data.data);

		if (skip + limit < data.total) {
			return fetchAllTasks(skip + limit, limit, allTasks);
		}

		return allTasks;
	};

	const homeworksPromise = fetchAllTasks()
		.then((tasks) => {
			const legacyData = tasks.map(mapV3TaskToLegacyHomework);

			// Filter to get only homeworks with dueDate within 7 days after and 1 year before today
			const sevenDaysFromNow = timesHelper.currentDate().add(7, 'days');
			const oneYearAgo = timesHelper.currentDate().subtract(1, 'year');

			const filteredLegacyData = legacyData.filter((homework) => {
				if (!homework.dueDate) {
					return true; // Keep homeworks without dueDate
				}
				const dueDate = timesHelper.fromUTC(homework.dueDate);
				return dueDate.isAfter(oneYearAgo) && dueDate.isBefore(sevenDaysFromNow);
			});

			return filteredLegacyData.map((homeworks) => {
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
				if (homeworks.lessonId != null) {
					homeworks.lessonHidden = homeworks.lessonId.hidden;
				} else {
					homeworks.lessonHidden = false;
				}
				homeworks.url = `/homework/${homeworks._id}`;
				homeworks.content = homeworks.description;
				return homeworks;
			});
		})
		.catch((err) => {
			/* eslint-disable-next-line max-len */
			logger.error(
				`Can not fetch data from /homework/ in router.all("/") | message: ${err.message}.`,
			);
			return [];
		});

	// Somehow $lte doesn't work in normal query so I manually put it into a request
	const newsPromise = api(req, { version: 'v3' })
		.get('/news', {
			qs: {
				limit: 3,
			},
		})
		.then((news) => news.data.map((n) => {
			n.url = `/news/${n.id}`;
			n.secondaryTitle = timesHelper.fromNow(n.displayAt);
			return n;
		}))
		.catch((err) => {
			/* eslint-disable-next-line max-len */
			logger.error(
				`Can not fetch data from /news/ in router.all("/") | message: ${err.message}.`,
			);
			return [];
		});

	const newestReleasePromise = api(req)
		.get('/releases', {
			qs: {
				$limit: 1,
				$sort: {
					publishedAt: -1,
				},
			},
		})
		.then(({ data }) => data)
		.catch((err) => {
			/* eslint-disable-next-line max-len */
			logger.error(
				`Can not fetch data from /releases in router.all("/") | message: ${err.message}.`,
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
				< Date.parse(newestRelease.publishedAt)
			);
			const roles = user.roles.map((role) => role.name);
			let homeworksFeedbackRequired = [];
			let homeworksWithFeedback = [];
			let studentHomeworks;
			let filteredAssignedHomeworks;

			const teacher = ['teacher'];
			const student = ['student'];

			const hasRole = (allowedRoles) => roles.some((role) => (allowedRoles || []).includes(role));

			if (newRelease || !userPreferences.releaseDate) {
				api(req)
					.patch(`/users/${user._id}`, {
						json: { 'preferences.releaseDate': newestRelease.publishedAt },
					})
					.catch(() => {
						logger.warn('failed to update user preference releaseDate');
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
						logger.warn('failed to update user preference releaseDate');
					});
				displayDataprivacyAlert = true;
			}
			let displayDataprivacyAlertFeb21 = false;
			let dataprivacyAlertFeb21Data = false;
			if (userPreferences.data_privacy_incident_note_2021_02_files
				&& !userPreferences.data_privacy_incident_note_2021_02_dismissed) {
				const filenameDelimiter = userPreferences
					.data_privacy_incident_note_2021_02_files.length > 5 ? ', ' : '<br>';
				dataprivacyAlertFeb21Data = userPreferences
					.data_privacy_incident_note_2021_02_files.join(filenameDelimiter);
				displayDataprivacyAlertFeb21 = true;
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
						&& !homework.hasEvaluation && !homework.lessonHidden,
				);
			}

			const translateKeyInfobanner = () => {
				switch (SC_THEME) {
					case 'n21':
						return 'dashboard.text.lernStoreBannerItem0_n21';
					case 'thr':
						return 'dashboard.text.lernStoreBannerItem0_thr';
					case 'brb':
						return 'dashboard.text.lernStoreBannerItem0_brb';
					default:
						return 'dashboard.text.lernStoreBannerItem0_dbc';
				}
			};

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
				translateKeyInfoBanner: translateKeyInfobanner(),
				showNewReleaseModal: newRelease,
				currentTime: timesHelper.fromUTC(currentTime).format('HH:mm'),
				isTeacher: hasRole(teacher),
				isStudent: hasRole(student),
				displayDataprivacyAlert,
				displayDataprivacyAlertFeb21,
				dataprivacyAlertFeb21Data,
			});
		})
		.catch(next);
});

module.exports = router;
