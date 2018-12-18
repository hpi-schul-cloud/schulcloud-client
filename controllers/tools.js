const _ = require('lodash');
const logger = require('winston');
//const moment = require('moment');
const express = require('express');
const router = express.Router({ mergeParams: true });
//const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const ltiCustomer = require('../helpers/ltiCustomer');
//const request = require('request');

const createToolHandler = (req, res, next) => {
    api(req).post('/ltiTools/', {
        json: req.body
    }).then(tool => {
        if (tool._id) {
            api(req).patch('/courses/' + req.body.courseId, {
                json: {
                    $push: {
                        ltiToolIds: tool._id
                    }
                }
            }).then(course => {
                res.redirect('/courses/' + course._id);
            });
        }
    });
};

const addToolHandler = (req, res, next) => {
    let action = '/courses/' + req.params.courseId + '/tools/add';

    const courses = api(req).get('/courses/' + req.params.courseId).then(course => {
        return course.name;
    }).catch(err => {
        logger.warn('Course not found');
        return '';
    });

    const ltiTools = api(req).get('/ltiTools', { qs: { isTemplate: true } }).then(tools => {
        return tools.data;
    }).catch(err => {
        logger.warn('ltiTools not found');
        return [];
    });

    const getData = ([courseName, toolsData]) => {
        return {
            action,
            title: 'Tool anlegen für ' + courseName || '',
            submitLabel: 'Tool anlegen',
            ltiTools: toolsData || [],
            courseId: req.params.courseId
        };
    };

    Promise.all([courses, ltiTools]).then(data => {
        res.render('courses/add-tool',getData(data));
    }).catch(err => {
        res.render('courses/add-tool',getData([]));
    });
};

const runToolHandler = (req, res, next) => {
    let currentUser = res.locals.currentUser;
    Promise.all([
        api(req).get('/ltiTools/' + req.params.ltiToolId),
        api(req).get('/roles/' + currentUser.roles[0]._id),
        api(req).get('/pseudonym?userId=' + currentUser._id + '&toolId=' + req.params.ltiToolId)
    ]).then(([tool, role, pseudonym]) => {
        let customer = new ltiCustomer.LTICustomer();
        let consumer = customer.createConsumer(tool.key, tool.secret);
        let user_id = '';
        if (tool.privacy_permission === 'pseudonymous') {
            user_id = pseudonym.data[0].pseudonym;
        } else if (tool.privacy_permission === 'name' || tool.privacy_permission === 'e-mail') {
            user_id = currentUser._id;
        }
        let payload = {
            lti_version: tool.lti_version,
            lti_message_type: tool.lti_message_type,
            resource_link_id: tool.resource_link_id || req.params.courseId,
            roles: customer.mapSchulcloudRoleToLTIRole(role.name),
            launch_presentation_document_target: 'window',
            launch_presentation_locale: 'en',
            lis_person_name_full: (tool.privacy_permission === 'name'
                ? currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}`
                : ''),
            lis_person_contact_email_primary: (tool.privacy_permission === 'e-mail'
                ? currentUser.email
                : ''),
            user_id
        };
        tool.customs.forEach((custom) => {
            payload[customer.customFieldToString(custom)] = custom.value;
        });

        let request_data = {
            url: tool.url,
            method: 'POST',
            data: payload
        };

        var formData = consumer.authorize(request_data);

        res.render('courses/components/run-lti-frame', {
            url: tool.url,
            method: 'POST',
            formData: Object.keys(formData).map(key => {
                return { name: key, value: formData[key] };
            })
        });
    });
};

const getDetailHandler = (req, res, next) => {
    Promise.all([
        api(req).get('/courses/', {
            qs: {
                teacherIds: res.locals.currentUser._id
            }
        }),
        api(req).get('/ltiTools/' + req.params.id)]).
        then(([courses, tool]) => {
            res.json({
                tool: tool
            });
        }).catch(err => {
            next(err);
        });
};

const showToolHandler = (req, res, next) => {

    Promise.all([
        api(req).get('/ltiTools/' + req.params.ltiToolId),
        api(req).get('/courses/' + req.params.courseId)
    ])
        .then(([tool, course]) => {
            let renderPath = tool.isLocal ? 'courses/run-tool-local' : 'courses/run-lti';
            res.render(renderPath, {
                course: course,
                title: `${tool.name}, Kurs/Fach: ${course.name}`,
                tool: tool
            });
        });
};


// secure routes
router.use(authHelper.authChecker);

router.get('/', (req, res, next) => {
    res.redirect('/courses/' + req.params.courseId);
});

router.get('/add', addToolHandler);
router.post('/add', createToolHandler);

router.get('/run/:ltiToolId', runToolHandler);
router.get('/show/:ltiToolId', showToolHandler);

router.get('/:id', getDetailHandler);

router.delete('/delete/:ltiToolId', function (req, res, next) {
    api(req).patch('/courses/' + req.params.courseId, {
        json: {
            $pull: {
                ltiToolIds: req.params.ltiToolId
            }
        }
    }).then(_ => {
        api(req).delete('/ltiTools/' + req.params.ltiToolId).then(_ => {
            res.sendStatus(200);
        });
    });
});

module.exports = router;
