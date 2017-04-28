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
        return options.fn(this);
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

const getSortmethods = () => {
    return [
        {
            functionname: 'availableDate',
            title: 'Verfügbarkeitsdatum'
        },
        {
            functionname: 'dueDate',
            title: 'Abgabedatum'
        },
        {
            functionname: '',
            title: 'Erstelldatum',
            active: "selected"
        }
    ];
};

const getCreateHandler = (service) => {
    return function (req, res, next) {
        if ((!req.body.courseId) || (req.body.courseId && req.body.courseId.length <= 2)) {
            req.body.courseId = null;
        }

        if (!req.body.availableDate || !req.body.dueDate) {
            var now = new Date();
            var dd = (now.getDate() < 10) ? "0" + now.getDate() : now.getDate();
            var MM = (now.getMonth() < 10) ? "0" + now.getMonth() : now.getMonth();
            var HH = (now.getHours() < 10) ? "0" + now.getHours() : now.getHours();
            var mm = (now.getMinutes() < 10) ? "0" + now.getMinutes() : now.getMinutes();
            if (!req.body.availableDate) {
                var availableDate = now.getFullYear() + "-" + MM + "-" + dd + "T" + HH + ":" + mm+ ":00.000Z";
                req.body.availableDate = availableDate;
            }
            if (!req.body.dueDate) {
                var dueDate = (now.getFullYear() + 9) + "-" + MM + "-" + dd + "T" + HH + ":" + mm + ":00.000Z"; //default dueDate: now + 9 years
                req.body.dueDate = dueDate;
            }
        }

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
        if ((!req.body.courseId) || (req.body.courseId && req.body.courseId.length <= 2)) {
            req.body.courseId = null;
        }
        if (!req.body.private) {
            req.body.private = false;
        }
        if (!req.body.publicSubmissions) {
            req.body.publicSubmissions = false;
        }
        api(req).patch('/' + service + '/' + req.params.id, {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};


const getDetailHandler = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id).then(
            data => {
                res.json(data);
            }).catch(err => {
            next(err);
        });
    };
};


const getDeleteHandlerR = (service) => {
    return function (req, res, next) {
        api(req).delete('/' + service + '/' + req.params.id).then(_ => {
            res.redirect(req.header('Referer'));
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
router.patch('/:id/json', getUpdateHandler('homework'));
router.get('/:id/json', getDetailHandler('homework'));
router.delete('/:id', getDeleteHandler('homework'));

router.patch('/submit/:id', getUpdateHandler('submissions'));
router.post('/submit', getCreateHandler('submissions'));

router.post('/comment', getCreateHandler('comments'));
router.delete('/comment/:id', getDeleteHandlerR('comments'));

router.all('/', function (req, res, next) {
    api(req).get('/homework/', {
        qs: {
            $populate: ['courseId']
        }
    }).then(assignments => {
        assignments = assignments.data.map(assignment => {
            if (new Date(assignment.availableDate).getTime() > Date.now()
                && assignment.teacherId != res.locals.currentUser._id) {
                return;
            }
            if (assignment.courseId != null) {
                if (assignment.courseId.userIds.indexOf(res.locals.currentUser._id) == -1
                    && assignment.teacherId != res.locals.currentUser._id) {
                    return;
                }
                if (!assignment.private) {
                    assignment.userIds = assignment.courseId.userIds;
                }
                assignment.color = (assignment.courseId.color.length != 7) ? "#1DE9B6" : assignment.courseId.color;
            } else {
                assignment.color = "#1DE9B6";
                assignment.private = true;
            }
            if (assignment.private
                && assignment.teacherId != res.locals.currentUser._id) {
                return;
            }
            assignment.url = '/homework/' + assignment._id;
            assignment.privateclass = assignment.private ? "private" : "";
            assignment.publicSubmissions = assignment.publicSubmissions;

            function formattimepart(s) {
                return (s < 10) ? "0" + s : s;
            }

            var availableDateRaw = new Date(assignment.availableDate);
            var availableDate = new Date(availableDateRaw.getTime() + (availableDateRaw.getTimezoneOffset() * 60000));
            var availableDateF = formattimepart(availableDate.getDate()) + "." + formattimepart(availableDate.getMonth() + 1) + "." + availableDate.getFullYear();
            var availableTimeF = formattimepart(availableDate.getHours()) + ":" + formattimepart(availableDate.getMinutes());

            var dueDateRaw = new Date(assignment.dueDate);
            var dueDate = new Date(dueDateRaw.getTime() + (dueDateRaw.getTimezoneOffset() * 60000));
            var dueDateF = formattimepart(dueDate.getDate()) + "." + formattimepart(dueDate.getMonth() + 1) + "." + dueDate.getFullYear();
            var dueTimeF = formattimepart(dueDate.getHours()) + ":" + formattimepart(dueDate.getMinutes());

            var now = new Date();
            var remaining = (dueDate - now);
            var remainingDays = Math.floor(remaining / (1000 * 60 * 60 * 24));
            var remainingHours = Math.floor((    remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var remainingMinutes = Math.floor(((    remaining % (1000 * 60 * 60 * 24)) % (1000 * 60 * 60)) / (1000 * 60));
            var dueColor;
            var dueString;
            if (remainingDays > 5 || remaining < 0) {
                dueColor = "";
                dueString = (dueDateF + " (" + dueTimeF + ")")
            }
            else if (remainingDays > 1) {
                dueColor = "days";
                dueString = "noch " + remainingDays + " Tage"
            }
            else if (remainingDays == 1) {
                dueColor = "hours";
                dueString = "noch " + remainingDays + " Tag " + remainingHours + ((remainingHours == 1) ? " Stunde" : " Stunden")
            }
            else if (remainingHours > 2) {
                dueColor = "hours";
                dueString = "noch " + remainingHours + " Stunden"
            }
            else if (remainingHours >= 1) {
                dueColor = "minutes";
                dueString = "noch " + remainingHours + ((remainingHours == 1) ? " Stunde " : " Stunden ") + remainingMinutes + ((remainingMinutes == 1) ? " Minute" : " Minuten")
            }
            else {
                dueColor = "minutes";
                dueString = "noch " + remainingMinutes + ((remainingMinutes == 1) ? " Minute" : " Minuten")
            }


            assignment.dueColor = dueColor;
            if((assignment.teacherId == res.locals.currentUser._id) && (remainingDays > 5 || remaining < 0)) {
                assignment.fromdate = availableDateF + " (" + availableTimeF + ")";
                assignment.todate = dueDateF + " (" + dueTimeF + ")";
            }else{
                 assignment.dueString = dueString;
            }

            assignment.availableDateReached = availableDate.getTime() > Date.now();

            const submissionPromise = getSelectOptions(req, 'submissions', {
                homeworkId: assignment._id,
                $populate: ['studentId']
            });
            Promise.resolve(submissionPromise).then(submissions => {
                if (assignment.private
                    && assignment.teacherId != res.locals.currentUser._id) {
                    return;
                }
                if (new Date(assignment.availableDate).getTime() > Date.now()
                    && assignment.teacherId != res.locals.currentUser._id) {
                    return;
                }
                if (assignment.courseId != null && assignment.courseId.userIds.indexOf(res.locals.currentUser._id) == -1
                    && assignment.teacherId != res.locals.currentUser._id) {
                    return;
                }

                if (assignment.teacherId === res.locals.currentUser._id) {
                    //teacher
                    assignment.submissionstats = submissions.length + "/" + assignment.userIds.length;
                    assignment.submissionstatsperc = Math.round((submissions.length/assignment.userIds.length)*100);
                    //assignment.submissionstatscolor = (submissions.length >= (assignment.userIds.length * 0.8)) ? "orange" : "";
                    //assignment.submissionstatscolor = (submissions.length >= (assignment.userIds.length)) ? "green" : "";
                    var submissioncount = (submissions.filter(function (a) {
                        return (a.gradeComment == '' && a.grade == null) ? 0 : 1
                    })).length
                    if (submissions.length > 0) {
                        assignment.gradedstats = submissioncount + "/" + submissions.length;
                        assignment.gradedstatsperc = Math.round((submissioncount/assignment.userIds.length)*100);
                        //assignment.gradedstatscolor = (submissioncount > (submissions.length * 0.7)) ? "" : "red";
                        if (submissioncount > 0) {
                            var ratingsum = 0;
                            var submissiongrades;
                            if (assignment.courseId.gradeSystem) {
                                submissiongrades = submissions.map(function (sub) {
                                    return 6 - Math.ceil(sub.grade / 3);
                                });
                            } else {
                                submissiongrades = submissions.map(function (sub) {
                                    return sub.grade;
                                });
                            }
                            submissiongrades.forEach(function (e) {
                                ratingsum += e
                            });
                            assignment.averagerating = (ratingsum / submissioncount).toFixed(1);
                        }
                    }
                } else {
                    //student
                    var submission = submissions.filter(function (n) {
                        return n.studentId._id == res.locals.currentUser._id;
                    })[0];
                    if (submission != null && submission.comment != ""){
                        assignment.dueColor = "submitted";
                    }
                }
            });


            assignment.currentUser = res.locals.currentUser;
            assignment.actions = getActions(assignment, '/homework/');
            return assignment;
        });

        assignments = assignments.filter(function (n) {
            return n != undefined;
        });

        var sortmethods = getSortmethods()
        if(req.query.sort){
            var sorting = JSON.parse(req.query.sort);
            // Hausaufgaben nach Abgabedatum sortieren
            sortmethods = sortmethods.map(function(e){
                if(e.functionname == sorting.fn){
                    e.active = 'selected';
                    e.desc = sorting.desc;
                }else{
                    delete e['active'];
                }
                return e;
            });
            if(sorting.fn == "availableDate"){
                assignments.sort(sortbyavailableDate);
            }else if(sorting.fn == "dueDate"){
                assignments.sort(sortbyDueDate);
            }            
            if(sorting.desc){
                assignments.reverse();
            }
        }
        function sortbyavailableDate(a, b) {
            var c = new Date((new Date(a.availableDate)).getTime() + ((new Date(a.availableDate)).getTimezoneOffset()*60000))
            var d = new Date((new Date(b.availableDate)).getTime() + ((new Date(b.availableDate)).getTimezoneOffset()*60000))
            if (c === d) {return 0;}
            else {return (c < d) ? -1 : 1;}
        }
        function sortbyDueDate(a, b) {
            var c = new Date((new Date(a.dueDate)).getTime() + ((new Date(a.dueDate)).getTimezoneOffset()*60000))
            var d = new Date((new Date(b.dueDate)).getTime() + ((new Date(b.dueDate)).getTimezoneOffset()*60000))
            if (c === d) {return 0;}
            else {return (c < d) ? -1 : 1;}
        }

        const coursesPromise = getSelectOptions(req, 'courses', {
            $or: [
                {userIds: res.locals.currentUser._id},
                {teacherIds: res.locals.currentUser._id}
            ]
        });

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
                if (roles.indexOf('student') == -1) {
                    isStudent = false;
                }
                res.render('homework/overview', {title: 'Meine Aufgaben', assignments, courses, isStudent, sortmethods});
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
            if (assignment.private
                && assignment.teacherId != res.locals.currentUser._id) {
                return;
            }
            if (new Date(assignment.availableDate).getTime() > Date.now()
                && assignment.teacherId != res.locals.currentUser._id) {
                return;
            }
            if (assignment.courseId != null) {
                if (assignment.courseId.userIds.indexOf(res.locals.currentUser._id) == -1
                    && assignment.teacherId != res.locals.currentUser._id) {
                    return;
                }
                assignment.color = (assignment.courseId.color.length != 7) ? "#1DE9B6" : assignment.courseId.color;
            } else {
                assignment.color = "#1DE9B6";
            }

            function formattimepart(s) {
                return (s < 10) ? "0" + s : s;
            }

            var availableDateRaw = new Date(assignment.availableDate);
            var availableDate = new Date(availableDateRaw.getTime() + (availableDateRaw.getTimezoneOffset() * 60000));
            assignment.availableDateF = formattimepart(availableDate.getDate()) + "." + formattimepart(availableDate.getMonth() + 1) + "." + availableDate.getFullYear();
            assignment.availableTimeF = formattimepart(availableDate.getHours()) + ":" + formattimepart(availableDate.getMinutes());

            var dueDateRaw = new Date(assignment.dueDate);
            var dueDate = new Date(dueDateRaw.getTime() + (dueDateRaw.getTimezoneOffset() * 60000));
            assignment.dueDateF = formattimepart(dueDate.getDate()) + "." + formattimepart(dueDate.getMonth() + 1) + "." + dueDate.getFullYear();
            assignment.dueTimeF = formattimepart(dueDate.getHours()) + ":" + formattimepart(dueDate.getMinutes());

            //23:59 am Tag der Abgabe
            //if (new Date(assignment.dueDate).getTime()+84340000 < Date.now()){
            if (new Date(assignment.dueDate).getTime() < Date.now()) {
                assignment.submittable = false;
            } else {
                assignment.submittable = true;
            }
            assignment.submission = submissions.filter(function (n) {
                return n.studentId == res.locals.currentUser._id;
            })[0];

            assignment.submissionscount = submissions.length;

            if (submissions.length > 0) {
                var ratingsum = 0;
                var submissiongrades;
                if (assignment.courseId.gradeSystem) {
                    submissiongrades = submissions.map(function (sub) {
                        return 6 - Math.ceil(sub.grade / 3);
                    });
                } else {
                    submissiongrades = submissions.map(function (sub) {
                        return sub.grade;
                    });
                }
                submissiongrades.forEach(function (e) {
                    ratingsum += e
                });
                assignment.averagerating = (ratingsum / assignment.submissionscount).toFixed(2);
            }

            if (assignment.teacherId == res.locals.currentUser._id && assignment.courseId != null || assignment.publicSubmissions) {
                assignment.submissions = submissions;
                const coursePromise = getSelectOptions(req, 'courses', {
                    _id: assignment.courseId._id,
                    $populate: ['userIds']
                });
                Promise.resolve(coursePromise).then(courses => {
                    var students = courses[0].userIds;
                    assignment.usercount = students.length;
                    students = students.map(student => {
                        return {
                            student: student,
                            submission: assignment.submissions.filter(function (n) {
                                return n.studentId == student._id;
                            })[0]
                        };
                    });
                    const ids = assignment.submissions.map(n => n._id);
                    const commentPromise = getSelectOptions(req, 'comments', {
                        submissionId: {$in: ids},
                        $populate: ['author']
                    });
                    Promise.resolve(commentPromise).then(comments => {
                        const coursesPromise = getSelectOptions(req, 'courses', {
                            $or: [
                                {userIds: res.locals.currentUser._id},
                                {teacherIds: res.locals.currentUser._id}
                            ]
                        });
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
                                if (roles.indexOf('student') == -1) {
                                    isStudent = false;
                                }
                                res.render('homework/assignment', Object.assign({}, assignment, {
                                    title: assignment.courseId.name + ' - ' + assignment.name,
                                    breadcrumb: [
                                        {
                                            title: 'Meine Aufgaben',
                                            url: '/homework'
                                        },
                                        {}
                                    ],
                                    students,
                                    courses,
                                    isStudent,
                                    comments
                                }));
                            });
                        });
                    });

                });
            } else {
                res.render('homework/assignment', Object.assign({}, assignment, {
                    title: (assignment.courseId == null) ? assignment.name : (assignment.courseId.name + ' - ' + assignment.name),
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
