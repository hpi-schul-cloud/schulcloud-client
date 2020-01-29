const moment = require('moment');
const express = require('express');
const shortId = require('shortid');
const Nexboard = require('nexboard-api-js');
const api = require('../api');
const apiEditor = require('../apiEditor');
const authHelper = require('../helpers/authentication');
const logger = require('../helpers/logger');

const router = express.Router({ mergeParams: true });

const etherpadBaseUrl = process.env.ETHERPAD_BASE_URL || 'https://etherpad.schul-cloud.org/p/';

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
			etherpadBaseUrl,
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

const getNexBoardAPI = () => {
	if (!process.env.NEXBOARD_USER_ID && !process.env.NEXBOARD_API_KEY) {
		logger.error('nexBoard env is currently not defined.');
	}
	return new Nexboard(process.env.NEXBOARD_API_KEY, process.env.NEXBOARD_USER_ID);
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

	// Check for neXboard compontent
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
	if (req.query.edtr || req.query.edtr_hash) {
		let edtrSource = '';
		if (req.query.edtr_hash) {
			edtrSource = `https://cdn.jsdelivr.net/gh/schul-cloud/edtrio@${req.query.edtr_hash}/dist/index.js`;
		} else {
			edtrSource = req.query.version === 'B' ? process.env.EDTR_SOURCE_B : process.env.EDTR_SOURCE;
		}

		// return to skip execution
		return res.render('topic/topic-edtr', {
			edtrSource: edtrSource || 'https://cdn.jsdelivr.net/gh/schul-cloud/edtrio@develop/dist/index.js',
			backendUrl: process.env.PUBLIC_BACKEND_URL || 'http://localhost:3030',
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
				title: 'Meine Kurse',
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

router.patch('/:topicId/neweditor', async (req, res, next) => {
	const [hidden, ...data] = req.body;

	if (hidden !== undefined) {
		// const visible = !hidden;
		// TODO root have to be implement
	} else {
		apiEditor(req).patch(`course/${req.params.courseId}/lessons/${req.params.topicId}`, {
			data,
		}).then(() => {
			res.sendStatus(200);
		}).catch((err) => {
			next(err);
		});
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
