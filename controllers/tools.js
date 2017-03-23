const _ = require('lodash');
const moment = require('moment');
const express = require('express');
const router = express.Router({ mergeParams: true });
const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const ltiCustomer = require('../helpers/ltiCustomer');
const request = require('request');

const addToolHandler = (req, res, next) => {
    let toolPromise, action, method;
    if(req.params.ltiToolId) {
        action = '/courses/' + req.params.courseId + '/tools/' + req.params.ltiToolId;
        method = 'patch';
        toolPromise = api(req).get('/tools/' + req.params.ltiToolId);
    } else {
        action = '/courses/' + req.params.courseId + '/tools/';
        method = 'post';
        toolPromise = Promise.resolve({});
    }

    Promise.all([
        api(req).get('/ltiTools/', {

            }),
        toolPromise
    ]).then(([tool]) => {
        const ltiTool = tool.data.filter(ltiTool => {
            if (ltiTool.hasOwnProperty("isTemplate", true)) {
                return ltiTool;
            }
        });
        res.render('courses/add-tool', {
            action,
            method,
            title: req.params.courseId ? 'Tool bearbeiten' : 'Tool anlegen',
            submitLabel: req.params.courseId ? 'Änderungen speichern' : 'Tool anlegen',
            ltiTool,
            courseId: req.params.courseId
        });
    });
};

const runToolHandler = (req, res, next) => {
    Promise.all([
        api(req).get('/ltiTools/' + req.params.ltiToolId)
    ]).then(([tool]) => {
       let customer = new ltiCustomer.LTICustomer();
       let consumer = customer.createConsumer(tool.key, tool.secret);
       let payload = {
           lti_version: tool.lti_version,
           lti_message_type: tool.lti_message_type,
           resource_link_id: tool.courseId  || tool.resource_link_id,
           roles: 'Learner', // todo: get role from currentUser
           launch_presentation_document_target: 'window',
           launch_presentation_locale: 'en'
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
        
        res.render('courses/components/run-lti', {
            url: tool.url,
            method: 'POST',
            formData: Object.keys(formData).map(key => {
                return {name: key, value: formData[key]}
            })
        });
    });
};


// secure routes
router.use(authHelper.authChecker);


router.get('/', (req, res, next) => {
    res.redirect('/courses/' + req.params.courseId);
});


router.get('/add', addToolHandler);

router.get('/run/:ltiToolId', runToolHandler);

//router.get('/:ltiToolId/edit', editToolHandler);


module.exports = router;
