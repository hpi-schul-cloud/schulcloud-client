/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const handlebars = require("handlebars");

handlebars.registerHelper('ifvalue', function (conditional, options) {
    if (options.hash.value === conditional) {
        return options.fn(this)
    } else {
        return options.inverse(this);
    }
});

router.use(authHelper.authChecker);

const getSelectOptions = (req, service, query, values = []) => {
    return api(req).get('/' + service, {
            qs: query
        }).then(data => {
            return data.data;
});
};

const getActions = (item, path) => {
    return [
        {
            link: path + item._id + "/json",
            class: 'btn-edit',
            icon: 'edit'
        },
        {
            link: path + item._id,
            class: 'btn-delete',
            icon: 'trash-o',
            method: 'delete'
        }
    ];
};

const getCreateHandler = (service) => {
    return function (req, res, next) {
        api(req).post('/' + service + '/', {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            res.redirect(req.header('Referer'));
    }).catch(err => {
            next(err);
    });
    };
};


const getUpdateHandler = (service) => {
    return function (req, res, next) {
        api(req).patch('/' + service + '/' + req.params.id, {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            console.log(req);
            res.redirect(req.header('Referer'));
    }).catch(err => {
            next(err);
    });
    };
};


const getDetailHandler = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id).then(
			data => {res.json(data);
		}).catch(err => {
			next(err);
		});
    };
};


const getDeleteHandler = (service) => {
    return function (req, res, next) {
        api(req).delete('/' + service + '/' + req.params.id).then(_ => {
            res.redirect('/' + service);
        }).catch(err => {
                next(err);
        });
    };
};


router.post('/', getCreateHandler('homework'));
router.patch('/:id', getUpdateHandler('homework'));
router.get('/:id/json', getDetailHandler('homework'));
router.delete('/:id', getDeleteHandler('homework'));

router.patch('/submit/:id', getUpdateHandler('submissions'));
router.post('/submit', getCreateHandler('submissions'));

router.post('/comment', getCreateHandler('comments'));

router.all('/', function (req, res, next) {
    api(req).get('/homework/', {
        qs: {
            $populate: ['courseId']
        }
    }).then(assignments => {
        assignments = assignments.data.map(assignment => {
            if(assignment.courseId.userIds.indexOf(res.locals.currentUser._id) == -1
                && assignment.teacherId != res.locals.currentUser._id){ return }
            if(assignment.private
                && assignment.teacherId != res.locals.currentUser._id){ return }
            if(new Date(assignment.availableDate).getTime() > Date.now()
                && assignment.teacherId != res.locals.currentUser._id){ return }
            assignment.url = '/homework/' + assignment._id;
            if(!assignment.private){
                assignment.userIds = assignment.courseId.userIds;
            }
			assignment.privateclass = assignment.private?"private":"";
			assignment.publicSubmissions = assignment.publicSubmissions; 
            var dueDate = new Date(assignment.dueDate);
            assignment.dueDateF = dueDate.getDate()+"."+(dueDate.getMonth()+1)+"."+dueDate.getFullYear();
            var availableDate = new Date(assignment.availableDate);
            assignment.availableDateReached = availableDate.getTime() > Date.now();
            const submissionPromise = getSelectOptions(req, 'submissions', {
                homeworkId: assignment._id,
                $populate: ['studentId']
            });
			assignment.currentUser = res.locals.currentUser;
            assignment.actions = getActions(assignment, '/homework/');
            return assignment;
        });
        assignments = assignments.filter(function(n){ return n != undefined });
        const coursesPromise = getSelectOptions(req, 'courses', {$or:[
            {userIds: res.locals.currentUser._id},
            {teacherIds: res.locals.currentUser._id}
        ]});
        Promise.resolve(coursesPromise).then(courses => {
            const userPromise = getSelectOptions(req, 'users', {
                _id: res.locals.currentUser._id,
                $populate: ['roles']
            });
            Promise.resolve(userPromise).then(user => {
                const roles = user[0].roles.map(role => {
                    return role.name;
                });
                var isStudent = true;
                if(roles.indexOf('student') == -1){
                    isStudent = false;
                }
                res.render('homework/overview', {title: 'Meine Aufgaben', assignments, courses, isStudent});
            });
        });

    });
});

router.get('/:assignmentId', function (req, res, next) {
    api(req).get('/homework/' + req.params.assignmentId, {
        qs: {
            $populate: ['courseId']
        }
    }).then(assignment => {
        const submissionPromise = getSelectOptions(req, 'submissions', {
            homeworkId: assignment._id
        });
        Promise.resolve(submissionPromise).then(submissions => {
            if(assignment.courseId.userIds.indexOf(res.locals.currentUser._id) == -1
                && assignment.teacherId != res.locals.currentUser._id){ return }
            if(assignment.private
                && assignment.teacherId != res.locals.currentUser._id){ return }
            if(new Date(assignment.availableDate).getTime() > Date.now()
                && assignment.teacherId != res.locals.currentUser._id){ return }
            if(!assignment.private){
                assignment.userIds = assignment.courseId.userIds;
            }
            var dueDate = new Date(assignment.dueDate);
            assignment.dueDateF = dueDate.getDate()+"."+(dueDate.getMonth()+1)+"."+dueDate.getFullYear();
            //23:59 am Tag der Abgabe
            if (new Date(assignment.dueDate).getTime()+84340000 < Date.now()){
                assignment.submittable = false;
            }else{
                assignment.submittable = true;
            }
            if(assignment.teacherId == res.locals.currentUser._id) {
                if(assignment.private){
                    assignment.submission = submissions.filter(function(n){ return n.studentId == res.locals.currentUser._id })[0];
                }
                assignment.submissions = submissions;
                const coursePromise = getSelectOptions(req, 'courses', {
                    _id: assignment.courseId._id,
                    $populate: ['userIds']
                });
                Promise.resolve(coursePromise).then(courses => {
                    var students = courses[0].userIds;
                    students = students.map(student => {
                        return {student: student,
                            submission: assignment.submissions.filter(function(n){
                                return n.studentId == student._id
                            })[0]};
                    });
                    console.log(students);
                    res.render('homework/assignment', Object.assign({}, assignment, {
                        title: assignment.courseId.name + ' - ' + assignment.name,
                        breadcrumb: [
                            {
                                title: 'Meine Aufgaben',
                                url: '/homework'
                            },
                            {}
                        ],
                        students
                    }));
                });
            }else{
                assignment.submission = submissions.filter(function(n){ return n.studentId == res.locals.currentUser._id })[0];
                assignment.gradeComment = submissions.filter(function(n){ return n.studentId == res.locals.currentUser._id })[0]["gradeComment"];
                res.render('homework/assignment', Object.assign({}, assignment, {
                    title: assignment.courseId.name + ' - ' + assignment.name,
                    breadcrumb: [
                        {
                            title: 'Meine Aufgaben',
                            url: '/homework'
                        },
                        {}
                    ]
                }));
            }
        });
	});
});

module.exports = router;
