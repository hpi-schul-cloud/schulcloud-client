const _ = require('lodash');
const moment = require('moment');
const express = require('express');
const router = express.Router({ mergeParams: true });
const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const ltiCustomer = require('../helpers/ltiCustomer');
const request = require('request');

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

    api(req).get('/ltiTools/')
    .then(tools => {
        const ltiTools = tools.data.filter(ltiTool => ltiTool.isTemplate == 'true');
        res.render('courses/add-tool', {
            action,
            title: 'Tool anlegen',
            submitLabel: 'Tool anlegen',
            ltiTools,
            courseId: req.params.courseId
        });
    });
};

const runToolHandler = (req, res, next) => {
    let currentUser = res.locals.currentUser;
    Promise.all([
        api(req).get('/ltiTools/' + req.params.ltiToolId),
        api(req).get('/roles/' + currentUser.roles[0]._id)
    ]).then(([tool, role]) => {
       let customer = new ltiCustomer.LTICustomer();
       let consumer = customer.createConsumer(tool.key, tool.secret);
       let payload = {
           lti_version: tool.lti_version,
           lti_message_type: tool.lti_message_type,
           resource_link_id: req.params.courseId  || tool.resource_link_id,
           roles: customer.mapSchulcloudRoleToLTIRole(role.name),
           launch_presentation_document_target: 'window',
           launch_presentation_locale: 'en',
           lis_person_name_full: currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}`,
           lis_person_contact_email_primary: currentUser.username ? `${currentUser.username}@schul-cloud.org` : 'jbaird@uni.ac.uk',
           user_id: currentUser._id
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
                return {name: key, value: formData[key]};
            })
        });
    });
};

const getDetailHandler = (req, res, next) => {
    Promise.all([
        api(req).get('/courses/', {
        qs: {
            teacherIds: res.locals.currentUser._id}
        }),
        api(req).get('/ltiTools/' + req.params.id)]).
    then(([courses, tool]) => {
        res.json({
            courses: courses,
            tool: tool
        });
    }).catch(err => {
        next(err);
    });
};

const showToolHandler = (req, res, next) => {
    api(req).get('/ltiTools/' + req.params.ltiToolId).then(tool => {
        res.render('courses/run-lti', {
            courseId: req.params.courseId,
            title: tool.name,
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
