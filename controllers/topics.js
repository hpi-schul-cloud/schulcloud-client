const moment = require('moment');
const express = require('express');
const shortId = require('shortid');
const router = express.Router({ mergeParams: true });
const Nexboard = require("nexboard-api-js");
const api = require('../api');
const authHelper = require('../helpers/authentication');
const winston = require('winston');
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

const etherpadBaseUrl = process.env.ETHERPAD_BASE_URL || 'https://etherpad.schul-cloud.org/etherpad/p/';

const editTopicHandler = (req, res, next) => {
    const context = req.originalUrl.split('/')[1];
    let lessonPromise, action, method;
    if (req.params.topicId) {
        action = `/${context}/`
                + (context === 'courses' ? req.params.courseId : req.params.teamId)
                + '/topics/' + req.params.topicId
                + (req.query.courseGroup ? '?courseGroup=' + req.query.courseGroup : '');
        method = 'patch';
        lessonPromise = api(req).get('/lessons/' + req.params.topicId);
    } else {
        action = `/${context}/`
                + (context === 'courses' ? req.params.courseId : req.params.teamId)
                + '/topics'
                + (req.query.courseGroup ? '?courseGroup=' + req.query.courseGroup : '');
        method = 'post';
        lessonPromise = Promise.resolve({});
    }


    lessonPromise.then(lesson => {
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
            teamId: req.params.teamId,
            courseGroupId: req.query.courseGroup,
            etherpadBaseUrl: etherpadBaseUrl
        });
    });
};

const checkInternalComponents = (data, baseUrl) => {
    let pattern = new RegExp(`(${baseUrl})(?!.*\/(edit|new|add|files\/my|files\/file|account|administration|topics)).*`);
    (data.contents || []).map(c => {
        if (c.component === 'internal' && !pattern.test((c.content || {}).url)) {
            (c.content || {}).url = baseUrl;
        }
    });
};


// secure routes
router.use(authHelper.authChecker);

router.get('/', (req, res, next) => {
    const context = req.originalUrl.split('/')[1];
    res.redirect(`/${context}/` + req.params.courseId);
});


router.get('/add', editTopicHandler);


router.post('/', async function(req, res, next) {
    const context = req.originalUrl.split('/')[1];
    const data = req.body;

    // Check for neXboard compontent
    data.contents = await createNewNexBoards(req, res, data.contents);

    data.contents = data.contents.filter(c => { return c !== undefined; });

    data.time = moment(data.time || 0, 'HH:mm').toString();
    data.date = moment(data.date || 0, 'YYYY-MM-DD').toString();

    req.query.courseGroup ? '' : delete data.courseGroupId;

    // recheck internal components by pattern
    checkInternalComponents(data, req.headers.origin);

    api(req).post('/lessons/', {
        json: data // TODO: sanitize
    }).then(_ => {
        res.redirect(
            context === 'courses'
            ? `/courses/` + req.params.courseId +
                (req.query.courseGroup ? '/groups/' + req.query.courseGroup : '')
            : `/teams/` + req.params.teamId + '/topics'
        );
    }).catch(_ => {
        res.sendStatus(500);
    });
});

router.post('/:id/share', function(req, res, next) {
    // if lesson already has shareToken, do not generate a new one
    api(req).get('/lessons/' + req.params.id).then(topic => {
        topic.shareToken = topic.shareToken || shortId.generate();
        api(req).patch("/lessons/" + req.params.id, { json: topic })
            .then(result => res.json(result))
            .catch(err => { res.err(err); });
    });
});


router.get('/:topicId', function(req, res, next) {
    const context = req.originalUrl.split('/')[1];
    Promise.all([
        api(req).get(`/${context}/` + req.params.courseId),
        api(req).get('/lessons/' + req.params.topicId, {
            qs: {
                $populate: ['materialIds']
            }
        }),
        api(req).get('/homework/', {
            qs: {
                courseId: req.params.courseId,
                lessonId: req.params.topicId,
                $populate: ['courseId'],
                archived: { $ne: res.locals.currentUser._id }
            }
        }),
        req.query.courseGroup ?
        api(req).get('/courseGroups/' + req.query.courseGroup) :
        Promise.resolve({})
    ]).then(([course, lesson, homeworks, courseGroup]) => {
        // decorate contents
        lesson.contents = (lesson.contents || []).map(block => {
            block.component = 'topic/components/content-' + block.component;
            return block;
        });
        homeworks = (homeworks.data || []).map(assignment => {
            assignment.url = '/homework/' + assignment._id;
            return assignment;
        });
        homeworks.sort((a, b) => {
            if (a.dueDate > b.dueDate) {
                return 1;
            } else {
                return -1;
            }
        });
        res.render('topic/topic', Object.assign({}, lesson, {
            title: lesson.name,
            context,
            homeworks: homeworks.filter(function(task) { return !task.private; }),
            myhomeworks: homeworks.filter(function(task) { return task.private; }),
            courseId: req.params.courseId,
            isCourseGroupTopic: courseGroup._id !== undefined,
            breadcrumb: [{
                    title: 'Meine Kurse',
                    url: `/${context}`
                },
                {
                    title: course.name,
                    url: `/${context}/` + course._id
                },
                courseGroup._id ? {
                    title: courseGroup.name,
                    url: `/${context}/` + course._id + '/groups/' + courseGroup._id
                } : {}
            ]
        }), (error, html) => {
            if (error) {
                throw 'error in GET /:topicId - res.render: ' + error;
            }
            res.send(html);
        });
    });
});

router.patch('/:topicId', async function(req, res, next) {
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

    req.query.courseGroup ? '' : delete data.courseGroupId;

    // create new Nexboard when necessary, if not simple hidden or position patch
    data.contents ? data.contents = await createNewNexBoards(req, res, data.contents) : '';


    if (data.contents)
        data.contents = data.contents.filter(c => { return c !== undefined; });

    // recheck internal components by pattern
    checkInternalComponents(data, req.headers.origin);

    api(req).patch('/lessons/' + req.params.topicId, {
        json: data // TODO: sanitize
    }).then(_ => {
        if (req.query.json) {
            res.json(_);
        } else {
            //sends a GET request, not a PATCH
            res.redirect(`/${context}/` + req.params.courseId + '/topics/' + req.params.topicId +
                (req.query.courseGroup ? '?courseGroup=' + req.query.courseGroup : ''));
        }
    }).catch(_ => {
        res.sendStatus(500);
    });
});

router.delete('/:topicId', function(req, res, next) {
    api(req).delete('/lessons/' + req.params.topicId).then(_ => {
        res.sendStatus(200);
    }).catch(err => {
        next(err);
    });
});

router.delete('/:topicId/materials/:materialId', function(req, res, next) {
    api(req).patch('/lessons/' + req.params.topicId, {
        json: {
            courseId: req.params.courseId,
            $pull: {
                materialIds: req.params.materialId
            }
        }
    }).then(_ => {
        api(req).delete('/materials/' + req.params.materialId).then(_ => {
            res.sendStatus(200);
        });
    });
});

router.get('/:topicId/edit', editTopicHandler);

async function createNewNexBoards(req, res, contents = []) {
    return await Promise.all(contents.map(async content => {
        if (content.component === "neXboard" && content.content.board === '0') {
            try {
            const board = await getNexBoardAPI().createBoard(
                content.content.title,
                content.content.description,
                await getNexBoardProjectFromUser(req, res.locals.currentUser),
                'demo');

            content.content.title = board.title;
            content.content.board = board.id;
            content.content.url = board.publicLink;
            content.content.description = board.description;

            return content;

            } catch (err) {
                logger.error(err);

                return undefined;
            }
        } else
            return content;
    }));
}

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
        api(req).patch('/users/' + user._id, { json: { preferences } });
    }
    return preferences.nexBoardProjectID;
};

const getNexBoards = (req, res, next) => {
    api(req).get('/lessons/contents/neXboard', {
            qs: {
                type: 'neXboard',
                user: res.locals.currentUser._id
            }
        })
        .then(boards => {
            res.json(boards);
        });
};

router.get('/:topicId/nexboard/boards', getNexBoards);

router.get('/nexboard/boards', getNexBoards);

module.exports = router;
