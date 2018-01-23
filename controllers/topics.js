const moment = require('moment');
const express = require('express');
const shortId = require('shortid');
const router = express.Router({ mergeParams: true });
const Nexboard = require("nexboard-api-js");
const api = require('../api');
const authHelper = require('../helpers/authentication');

const etherpadBaseUrl = process.env.ETHERPAD_BASE_URL || 'https://etherpad.schul-cloud.org/etherpad/p/';

const editTopicHandler = (req, res, next) => {
    let lessonPromise, action, method;
    if (req.params.topicId) {
        action = '/courses/' + req.params.courseId + '/topics/' + req.params.topicId +
            (req.query.courseGroup ? '?courseGroup=' + req.query.courseGroup : '');
        method = 'patch';
        lessonPromise = api(req).get('/lessons/' + req.params.topicId);
    } else {
        action = '/courses/' + req.params.courseId + '/topics' +
            (req.query.courseGroup ? '?courseGroup=' + req.query.courseGroup : '');
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
            courseGroupId: req.query.courseGroup,
            etherpadBaseUrl: etherpadBaseUrl
        });
    });
};


// secure routes
router.use(authHelper.authChecker);


router.get('/', (req, res, next) => {
    res.redirect('/courses/' + req.params.courseId);
});


router.get('/add', editTopicHandler);


router.post('/', function(req, res, next) {

    const data = req.body;

    // Check for neXboard compontent
    data.contents = createNewNexBoards(req, res, data.contents);

    data.time = moment(data.time || 0, 'HH:mm').toString();
    data.date = moment(data.date || 0, 'YYYY-MM-DD').toString();

    req.query.courseGroup ? delete data.courseId : delete data.courseGroupId;

    api(req).post('/lessons/', {
        json: data // TODO: sanitize
    }).then(_ => {
        res.redirect('/courses/' + req.params.courseId +
            (req.query.courseGroup ? '/groups/' + req.query.courseGroup : ''));
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

    Promise.all([
        api(req).get('/courses/' + req.params.courseId),
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
        })
    ]).then(([course, lesson, homeworks]) => {
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
            homeworks: homeworks.filter(function(task) { return !task.private; }),
            myhomeworks: homeworks.filter(function(task) { return task.private; }),
            breadcrumb: [{
                    title: 'Meine Kurse',
                    url: '/courses'
                },
                {
                    title: course.name,
                    url: '/courses/' + course._id
                },
                {}
            ]
        }), (error, html) => {
            if (error) {
                throw 'error in GET /:topicId - res.render: ' + error;
            }
            res.send(html);
        });
    });
});

router.patch('/:topicId', function(req, res, next) {
    const data = req.body;
    data.time = moment(data.time || 0, 'HH:mm').toString();
    data.date = moment(data.date || 0, 'YYYY-MM-DD').toString();

    // if not a simple hidden or position patch, set contents to empty array
    if (!data.contents && !req.query.json) {
        data.contents = [];
    }

    req.query.courseGroup ? delete data.courseId : delete data.courseGroupId;

    // create new Nexboard when necessary
    data.contents = createNewNexBoards(req, res, data.contents);
    api(req).patch('/lessons/' + req.params.topicId, {
        json: data // TODO: sanitize
    }).then(_ => {
        if (req.query.json) {
            res.json(_);
        } else {
            //sends a GET request, not a PATCH
            res.redirect('/courses/' + req.params.courseId + '/topics/' + req.params.topicId +
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

const createNewNexBoards = (req, res, contents = []) => {
    contents.forEach(content => {
        if (content.component === "neXboard" && content.content.board === '0') {
            const board = getNexBoardAPI().createBoard(
                content.content.title,
                content.content.description,
                getNexBoardProjectFromUser(req, res.locals.currentUser));
            content.content.title = board.title;
            content.content.board = board.boardId;
            content.content.url = "https://" + board.public_link;
            content.content.description = board.description;
        }
    });
    return contents;
};

const getNexBoardAPI = () => {
    if (!process.env.NEXBOARD_USER_ID && !process.env.NEXBOARD_API_KEY) {
        //TODO handle error properly

    }
    return new Nexboard(process.env.NEXBOARD_API_KEY, process.env.NEXBOARD_USER_ID);
};

const getNexBoardProjectFromUser = (req, user) => {
    const preferences = user.preferences || {};
    if (typeof preferences.nexBoardProjectID === 'undefined') {
        const project = getNexBoardAPI().createProject(user._id, user._id);
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