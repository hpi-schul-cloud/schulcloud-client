const _ = require('lodash');
const express = require('express');
const router = express.Router({ mergeParams: true });
const api = require('../api');
const authHelper = require('../helpers/authentication');

const getSelectOptions = (req, service, query, values = []) => {
  return api(req).get('/' + service, {
      qs: query
  }).then(data => {
      return data.data;
  });
};

const markSelected = (options, values = []) => {
  return options.map(option => {
      option.selected = values.includes(option._id);
      return option;
  });
};

const editCourseGroupHandler = (req, res, next) => {
  let courseGroupId = req.params.courseGroupId;
  let courseId = req.params.courseId;

  let courseGroupPromise, action, method;
  if (courseGroupId) {
      action = `/courses/${courseId}/groups/${courseGroupId}`;
      method = 'patch';
      courseGroupPromise = api(req).get('/courseGroups/', {
          qs: {
              $populate: ['userIds']
          }
      });
  } else {
      action = `/courses/${courseId}/groups`;
      method = 'post';
      courseGroupPromise = Promise.resolve({});
  }

  const studentsPromise = getSelectOptions(req, 'users', {roles: ['student', 'demoStudent'], $limit: 1000});
  Promise.all([
      courseGroupPromise,
      studentsPromise
  ]).then(([courseGroup, students]) => {
      students = students.filter(s => s.schoolId === res.locals.currentSchool);
      res.render('courses/edit-courseGroup', {
          action,
          method,
          courseGroup,
          courseId,
          students: markSelected(students, _.map(courseGroup.userIds, '_id')),
          title: req.params.courseGroupId ? 'Schülergruppe bearbeiten' : 'Schülergruppe anlegen',
          submitLabel: req.params.courseGroupId ? 'Änderungen speichern' : 'Schülergruppe anlegen',
          closeLabel: 'Abbrechen'
      });
  });
};

// secure routes
router.use(authHelper.authChecker);

router.get('/add', editCourseGroupHandler);

router.post('/', function (req, res, next) {
    api(req).post('/courseGroups/', {
        json: req.body // TODO: sanitize
    }).then(courseGroup => {
        res.redirect('/courses/' + req.params.courseId);
    }).catch(err => {
        res.sendStatus(500);
    });
});

module.exports = router;