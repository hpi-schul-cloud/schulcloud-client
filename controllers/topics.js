const moment = require('moment');
const express = require('express');
const shortId = require('shortid');
const Nexboard = require('nexboard-api-js');
const api = require('../api');
const apiEditor = require('../apiEditor');
const authHelper = require('../helpers/authentication');
const logger = require('../helpers/logger');
const { EDTR_SOURCE } = require('../config/global');

const router = express.Router({ mergeParams: true });

const {
	ETHERPAD_PAD_URI,
	NEXBOARD_USER_ID,
	NEXBOARD_API_KEY,
	PUBLIC_BACKEND_URL,
} = require('../config/global');

const editTopicHandler = (req, res, next) => {
	const context = req.originalUrl.split('/')[1];
	let lessonPromise; let action; let
		method;
	if (req.params.topicId) {
		action = `/${context}/${context === 'courses' ? req.params.courseId : req.params.teamId}`
		+ `/topics/${req.params.topicId}${req.query.courseGroup ? `?courseGroup=${req.query.courseGroup}` : ''}`;
		method = 'patch';
		lessonPromise = api(req).get(`/lessons/${req.params.topicId}`);
	} else {
		action = `/${context}/${context === 'courses' ? req.params.courseId : req.params.teamId}`
		+ `/topics${req.query.courseGroup ? `?courseGroup=${req.query.courseGroup}` : ''}`;
		method = 'post';
		lessonPromise = Promise.resolve({});
	}


	lessonPromise.then((lesson) => {
		if (lesson.contents) {
			// so we can share the content through data-value to the react component
			lesson.contents = JSON.stringify(lesson.contents);
		}

		res.render('topic/edit-topic', {
			action,
			method,
			title: req.params.topicId ? 'Thema bearbeiten' : 'Thema anlegen',
			submitLabel: req.params.topicId ? 'Änderungen speichern' : 'Thema anlegen',
			closeLabel: 'Abbrechen',
			lesson,
			courseId: req.params.courseId,
			topicId: req.params.topicId,
			teamId: req.params.teamId,
			courseGroupId: req.query.courseGroup,
			etherpadBaseUrl: ETHERPAD_PAD_URI,
		});
	}).catch((err) => {
		next(err);
	});
};

const checkInternalComponents = (data, baseUrl) => {
	const pattern =	new RegExp(
		`(${baseUrl})(?!.*/(edit|new|add|files/my|files/file|account|administration|topics)).*`,
	);
	(data.contents || []).forEach((c) => {
		if (c.component === 'internal' && !pattern.test((c.content || {}).url)) {
			(c.content || {}).url = baseUrl;
		}
	});

	return data;
};

const getEtherpadPadForCourse = async (req, user, courseId, content) => {
	const pad = await api(req).post('/etherpad/pads', {
		json: {
			courseId,
			padName: content.title,
			text: content.description,
		},
	}).catch((err) => {
		logger.error(err);
	});

	return pad.data.padID;
};

async function createNewEtherpad(req, res, contents = [], courseId) {
	// eslint-disable-next-line no-return-await
	return await Promise.all(contents.map(async (content) => {
		if (!!content && content.component === 'Etherpad') {
			try {
				const etherpadPadId = await getEtherpadPadForCourse(req, res.locals.currentUser, courseId, content);
				content.content.url = `${ETHERPAD_PAD_URI}/${etherpadPadId}`;
				return content;
			} catch (err) {
				logger.error(err);

				return undefined;
			}
		} else {
			return content;
		}
	}));
}

const getEtherpads = (req, res, next) => {
	api(req).get('/lessons/contents/etherpad', {
		qs: {
			type: 'etherpad',
			user: res.locals.currentUser._id,
		},
	})
		.then((pads) => {
			res.json(pads);
		});
};

const getEtherpadSession = (req, res, courseId) => api(req).post(
	'/etherpad/sessions', {
		form: {
			courseId,
		},
	}
).then((sessionInfo) => sessionInfo);

router.get('/:topicId/etherpads/pads', getEtherpads);

router.get('/etherpad/pads', getEtherpads);

const getNexBoardAPI = () => {
	if (!NEXBOARD_USER_ID && !NEXBOARD_API_KEY) {
		logger.error('nexBoard env is currently not defined.');
	}
	return new Nexboard(NEXBOARD_API_KEY, NEXBOARD_USER_ID);
};

const getNexBoardProjectFromUser = async (req, user) => {
	const preferences = user.preferences || {};
	if (typeof preferences.nexBoardProjectID === 'undefined') {
		const project = await getNexBoardAPI().createProject(user._id, user._id);
		preferences.nexBoardProjectID = project.id;
		await api(req).patch(`/users/${user._id}`, { json: { preferences } });
	}
	return preferences.nexBoardProjectID;
};

async function createNewNexBoards(req, res, contents = []) {
	// eslint-disable-next-line no-return-await
	return await Promise.all(contents.map(async (content) => {
		if (content.component === 'neXboard' && content.content.board === '0') {
			try {
				const nextboardProject = await getNexBoardProjectFromUser(req, res.locals.currentUser);
				const board = await getNexBoardAPI().createBoard(
					content.content.title,
					content.content.description,
					nextboardProject,
					'schulcloud',
				);

				content.content.title = board.title;
				content.content.board = board.id;
				content.content.url = board.publicLink;
				content.content.description = board.description;

				return content;
			} catch (err) {
				logger.error(err);

				return undefined;
			}
		} else {
			return content;
		}
	}));
}

const getNexBoards = (req, res, next) => {
	api(req).get('/lessons/contents/neXboard', {
		qs: {
			type: 'neXboard',
			user: res.locals.currentUser._id,
		},
	})
		.then((boards) => {
			res.json(boards);
		});
};

router.get('/:topicId/nexboard/boards', getNexBoards);

router.get('/nexboard/boards', getNexBoards);


// secure routes
router.use(authHelper.authChecker);

router.get('/', (req, res, next) => {
	const context = req.originalUrl.split('/')[1];
	res.redirect(`/${context}/${req.params.courseId}`);
});


router.get('/add', editTopicHandler);


router.post('/', async (req, res, next) => {
	const context = req.originalUrl.split('/')[1];
	const data = req.body;

	// Check for etherpad component
	data.contents = await createNewEtherpad(req, res, data.contents, data.courseId);
	// Check for neXboard component
	data.contents = await createNewNexBoards(req, res, data.contents);

	data.contents = data.contents.filter(c => c !== undefined);

	data.time = moment(data.time || 0, 'HH:mm').toString();
	data.date = moment(data.date || 0, 'YYYY-MM-DD').toString();

	// what? req.query.courseGroup ? '' : delete data.courseGroupId;
	if (!req.query.courseGroup) {
		delete data.courseGroupId;
	}

	// recheck internal components by pattern
	checkInternalComponents(data, req.headers.origin);

	api(req).post('/lessons/', {
		json: data, // TODO: sanitize
	}).then(() => {
		res.redirect(
			context === 'courses'
				? `/courses/${req.params.courseId
				}${req.query.courseGroup ? `/groups/${req.query.courseGroup}` : '/?activeTab=topics'}`
				: `/teams/${req.params.teamId}/?activeTab=topics`,
		);
	}).catch(() => {
		res.sendStatus(500);
	});
});

router.post('/:id/share', (req, res, next) => {
	// if lesson already has shareToken, do not generate a new one
	api(req).get(`/lessons/${req.params.id}`).then((topic) => {
		topic.shareToken = topic.shareToken || shortId.generate();
		api(req).patch(`/lessons/${req.params.id}`, { json: topic })
			.then(result => res.json(result))
			.catch((err) => { res.err(err); });
	});
});

// eslint-disable-next-line consistent-return
router.get('/:topicId', (req, res, next) => {
	// ############################# start new Edtior ###################################
	if (req.query.edtr && EDTR_SOURCE) {
		// return to skip rendering old editor
		return res.render('topic/topic-edtr', {
			EDTR_SOURCE,
		});
	}
	// ############################## end new Edtior ######################################

	const context = req.originalUrl.split('/')[1];
	Promise.all([
		api(req).get(`/${context}/${req.params.courseId}`),
		api(req).get(`/lessons/${req.params.topicId}`, {
			qs: {
				$populate: ['materialIds'],
			},
		}),
		api(req).get('/homework/', {
			qs: {
				courseId: req.params.courseId,
				lessonId: req.params.topicId,
				$populate: ['courseId'],
				archived: { $ne: res.locals.currentUser._id },
			},
		}),
		req.query.courseGroup
			? api(req).get(`/courseGroups/${req.query.courseGroup}`)
			: Promise.resolve({}),
	]).then(([course, lesson, homeworks, courseGroup]) => {
		let returnPromise;
		const foundEtherpad = lesson.contents.find((content) => content.component === 'Etherpad');
		if (foundEtherpad) {
			returnPromise = Promise.all([
				getEtherpadSession(req, res, course.id),
				Promise.resolve(course),
				Promise.resolve(lesson),
				Promise.resolve(homeworks),
				Promise.resolve(courseGroup),
			]);
		} else {
			returnPromise = Promise.all([
				Promise.resolve(undefined),
				Promise.resolve(course),
				Promise.resolve(lesson),
				Promise.resolve(homeworks),
				Promise.resolve(courseGroup),
			]);
		}
		return returnPromise;
	}).then(([etherpadSession, course, lesson, homeworks, courseGroup]) => {
		const etherpadLoginPromises = [];
		let etherpadComponentCount = 0;
		if (typeof(lesson.contents) !== 'undefined') {
			etherpadComponentCount = lesson.contents.filter((content) => content.component === 'Etherpad').length;
		}
		etherpadLoginPromises.push(Promise.resolve(etherpadComponentCount));
		if (typeof(lesson.contents) !== 'undefined') {
			lesson.contents.forEach((this, index) => {
				if (this.component === 'Etherpad') {
					const { url } = this.content;
					const padId = url.substring(url.lastIndexOf('/') + 1);
					// set cookie for this pad
					etherpadLoginPromises.push(
						Promise.resolve(authHelper.etherpad_cookie_helper(etherpadSession, padId, res)),
					);
				}
			});
		}
		etherpadLoginPromises.push(Promise.resolve(course));
		etherpadLoginPromises.push(Promise.resolve(lesson));
		etherpadLoginPromises.push(Promise.resolve(homeworks));
		etherpadLoginPromises.push(Promise.resolve(courseGroup));

		return Promise.all(etherpadLoginPromises);
	}).then((promisesWithEPLogin) => {
		const etherpadNumber = promisesWithEPLogin.shift();
		for (let i = 0; i < etherpadNumber; i += 1) {
			promisesWithEPLogin.shift();
		}

		const [course, lesson, homeworks, courseGroup] = promisesWithEPLogin;
		// decorate contents
		lesson.contents = (lesson.contents || []).map((block) => {
			block.component = `topic/components/content-${block.component}`;
			return block;
		});
		// eslint-disable-next-line no-param-reassign
		homeworks = (homeworks.data || []).map((assignment) => {
			assignment.url = `/homework/${assignment._id}`;
			return assignment;
		});
		homeworks.sort((a, b) => {
			if (a.dueDate > b.dueDate) {
				return 1;
			}
			return -1;
		});
		// return for consistent return
		return res.render('topic/topic', Object.assign({}, lesson, {
			title: lesson.name,
			context,
			homeworks: homeworks.filter(task => !task.private),
			myhomeworks: homeworks.filter(task => task.private),
			courseId: req.params.courseId,
			isCourseGroupTopic: courseGroup._id !== undefined,
			breadcrumb: [{
				title: res.$t("courses.headline.myCourses"),
				url: `/${context}`,
			},
			{
				title: `${course.name} ${!courseGroup._id ? '> Themen' : ''}`,
				url: `/${context}/${course._id}`,
			},
			courseGroup._id ? {
				title: `${courseGroup.name} > Themen`,
				url: `/${context}/${course._id}/groups/${courseGroup._id}`,
			} : {},
			{
				title: lesson.name,
				url: `/${context}/${course._id}/topics/${lesson._id}`,
			},
			],
		}), (error, html) => {
			if (error) {
				throw new Error('error in GET /:topicId - res.render', error);
			}
			res.send(html);
		});
	}).catch((err) => {
		next(err);
	});
});

router.patch('/:topicId', async (req, res, next) => {
	const context = req.originalUrl.split('/')[1];
	const data = req.body;

	data.time = moment(data.time || 0, 'HH:mm').toString();
	data.date = moment(data.date || 0, 'YYYY-MM-DD').toString();

	if (!data.courseId && !req.query.courseGroup) {
		data.courseId = req.params.courseId;
	}

	// if not a simple hidden or position patch, set contents to empty array
	if (!data.contents && !req.query.json) {
		data.contents = [];
	}

	if (!req.query.courseGroup) delete data.courseGroupId;

	// create new Nexboard when necessary, if not simple hidden or position patch
	if (data.contents) data.contents = await createNewNexBoards(req, res, data.contents);

	if (data.contents) { data.contents = data.contents.filter(c => c !== undefined); }

	// recheck internal components by pattern
	checkInternalComponents(data, req.headers.origin);

	api(req).patch(`/lessons/${req.params.topicId}`, {
		json: data, // TODO: sanitize
	}).then((lesson) => {
		if (req.query.json) {
			res.json(lesson);
		} else {
			// sends a GET request, not a PATCH
			res.redirect(`/${context}/${req.params.courseId}/topics/${req.params.topicId
			}${req.query.courseGroup ? `?courseGroup=${req.query.courseGroup}` : ''}`);
		}
	}).catch(() => {
		res.sendStatus(500);
	});
});

router.delete('/:topicId', (req, res, next) => {
	api(req).delete(`/lessons/${req.params.topicId}`).then(() => {
		res.sendStatus(200);
	}).catch((err) => {
		next(err);
	});
});

router.delete('/:topicId/materials/:materialId', (req, res, next) => {
	api(req).patch(`/lessons/${req.params.topicId}`, {
		json: {
			courseId: req.params.courseId,
			$pull: {
				materialIds: req.params.materialId,
			},
		},
	}).then(() => {
		api(req).delete(`/materials/${req.params.materialId}`).then(() => {
			res.sendStatus(200);
		});
	});
});

router.get('/:topicId/edit', editTopicHandler);

// ########################################## new Edtiro ############################################

router.get('/add/neweditor', async (req, res, next) => {
	const lesson = await apiEditor(req).post(`/course/${req.params.courseId}/lessons`, {
		title: '',
	});

	res.redirect(`/courses/${req.params.courseId}/topics/${lesson._id}?edtr=true`);
});

const boolean = v => v === 1 || v === 'true' || v === true || v === '1';
router.patch('/:topicId/neweditor', (req, res, next) => {
	if (req.body.hidden !== undefined) {
		apiEditor(req).patch(`/helpers/setVisibility/${req.params.topicId}`, {
			json: { visible: !boolean(req.body.hidden) },
		}).then((response) => {
			res.json({
				hidden: !response.visible,
			});
		}).catch((err) => {
			next(err);
		});
	} else {
		res.sendStatus(200);
	}
});

router.delete('/:topicId/neweditor', async (req, res, next) => {
	apiEditor(req).delete(`course/${req.params.courseId}/lessons/${req.params.topicId}`).then(() => {
		res.sendStatus(200);
	}).catch((err) => {
		next(err);
	});
});


module.exports = router;
