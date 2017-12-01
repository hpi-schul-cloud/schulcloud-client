const _ = require('lodash');
const moment = require('moment');
const express = require('express');
const shortid = require('shortid');
const router = express.Router({ mergeParams: true });
const marked = require('marked');
const Nexbord = require("nexboard-api-js");
const api = require('../api');
const authHelper = require('../helpers/authentication');


const editTopicHandler = (req, res, next) => {
    let lessonPromise, action, method;
    if(req.params.topicId) {
        action = '/courses/' + req.params.courseId + '/topics/' + req.params.topicId;
        method = 'patch';
        lessonPromise = api(req).get('/lessons/' + req.params.topicId);
    } else {
        action = '/courses/' + req.params.courseId + '/topics/';
        method = 'post';
        lessonPromise = Promise.resolve({});
    }


    Promise.all([
        lessonPromise
    ]).then(([lesson]) => {
        if(lesson.contents) {
            // so we can share the content through data-value to the react component
            lesson.contents = JSON.stringify(lesson.contents);
        }

        res.render('topic/edit-topic', {
            action,
            method,
            title: req.params.topicId ? 'Thema bearbeiten' : 'Thema anlegen',
            submitLabel: req.params.topicId ? 'Änderungen speichern' : 'Thema anlegen',
            lesson,
            courseId: req.params.courseId
        });
    });
};


// secure routes
router.use(authHelper.authChecker);


router.get('/', (req, res, next) => {
    res.redirect('/courses/' + req.params.courseId);
});


router.get('/add', editTopicHandler);


router.post('/', function (req, res, next) {

    const data = req.body;

    // Check for neXboard compontent
    data.contents = createNewNexBoards(req,res,data.contents);

    data.time = moment(data.time || 0, 'HH:mm').toString();
    data.date = moment(data.date || 0, 'YYYY-MM-DD').toString();

    api(req).post('/lessons/', {
        json: data // TODO: sanitize
    }).then(_ => {
        res.redirect('/courses/' + req.params.courseId + '/topics/');
    }).catch(_ => {
        res.sendStatus(500);
    });
});

router.post('/:id/share', function (req, res, next) {
    // if lesson already has shareToken, do not generate a new one
    api(req).get('/lessons/' + req.params.id).then(topic => {
        topic.shareToken = topic.shareToken || shortid.generate();
        api(req).patch("/lessons/" + req.params.id, {json: topic})
            .then(result => res.json(result))
            .catch(err => {res.err(err);});
    });
});


router.get('/:topicId', function (req, res, next) {

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
                archived : {$ne: res.locals.currentUser._id }
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
        homeworks.sort((a,b) => {
            if(a.dueDate > b.dueDate) {
                return 1;
            } else {
                return -1;
            }
        });
        res.render('topic/topic', Object.assign({}, lesson, {
            title: lesson.name,
            homeworks: homeworks.filter(function(task){return !task.private;}),
            myhomeworks: homeworks.filter(function(task){return task.private;}),
            breadcrumb: [
                {
                    title: 'Meine Kurse',
                    url: '/courses'
                },
                {
                    title: course.name,
                    url: '/courses/' + course._id
                },
                {}
            ]
        }));
    });
});

router.patch('/:topicId', function (req, res, next) {
    const data = req.body;
    data.time = moment(data.time || 0, 'HH:mm').toString();
    data.date = moment(data.date || 0, 'YYYY-MM-DD').toString();

    // if not a simple hidden or position patch, set contents to empty array
    if (!data.contents && !req.query.json) data.contents = [];

    // create new Nexboard when necessary
    data.contents = createNewNexBoards(req,res,data.contents);

    api(req).patch('/lessons/' + req.params.topicId, {
        json: data // TODO: sanitize
    }).then(_ => {
        if (req.query.json) {
            res.json(_);
        } else {
            res.redirect('/courses/' + req.params.courseId + '/topics/' + req.params.topicId);
        }
    }).catch(_ => {
        res.sendStatus(500);
    });
});


router.delete('/:topicId', function (req, res, next) {
    api(req).delete('/lessons/' + req.params.topicId).then(_ => {
        res.sendStatus(200);
    }).catch(err => {
        next(err);
    });
});

router.delete('/:topicId/materials/:materialId', function (req, res, next) {
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

const createNewNexBoards = (req,res,contents = []) =>{
    contents.forEach(content =>{
        if (content.component === "neXboard" && content.content.board === 0){
            var board = getNexBoardAPI().createBoard(
                content.content.title,
                content.content.description,
                getNexBoardProjectFromUser(req,res.locals.currentUser));
            content.content.title = board.title;
            content.content.board = board.boardId;
            content.content.url = "https://" + board.public_link;
            content.content.description = board.description;
        }
    });
    return contents;
};

const getNexBoardAPI = () =>{
    let userId = process.env.NEXBOARD_USER_ID;
    let apikey = process.env.NEXBOARD_API_KEY;
    return new Nexbord(apikey,userId);
};

const getNexBoardProjectFromUser = (req,user) =>{
    var preferences = user.preferences || {};
    if (typeof preferences.nexBoardProjectID === "undefined") {
        var project = getNexBoardAPI().createProject(user._id,user._id);
        preferences.nexBoardProjectID = project.id;
        api(req).patch('/users/' + user._id, {json: {
            preferences}});
    }
    return preferences.nexBoardProjectID;
};

const getNexBoards = (req,res,next) => {
    res.json(getNexBoardAPI().getBoardsByProject(getNexBoardProjectFromUser(req,res.locals.currentUser)));
};

router.get('/:topicId/nexboard/boards', getNexBoards);


router.get('/nexboard/boards',getNexBoards);


module.exports = router;
