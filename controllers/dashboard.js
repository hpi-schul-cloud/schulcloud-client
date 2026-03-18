/*
 * One Controller per layout view
 */

const express = require('express');
const { logger } = require('../helpers');

const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');
const timesHelper = require('../helpers/timesHelper');

// secure routes
router.use(authHelper.authChecker);

router.get('/', (req, res, next) => {
	const mapV3TaskToLegacyHomework = (task) => ({
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
	});

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
		homeworksPromise,
		newestReleasePromise,
	])
		.then(([assignedHomeworks, newestReleases]) => {
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

			return res.json({
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
				showNewReleaseModal: newRelease,
			});
		})
		.catch(next);
});

module.exports = router;
