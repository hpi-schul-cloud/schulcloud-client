/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const handlebars = require("handlebars");
const moment = require("moment");

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
            link: path + item._id + "/edit",
            class: 'btn-edit',
            icon: 'edit',
            alt: 'bearbeiten'
        },
        {
            link: path + item._id,
            class: 'btn-delete',
            icon: 'trash-o',
            method: 'delete',
            alt: 'löschen'
        }
    ];
};

const getSortmethods = () => {
    return [
        {
            query: 'dueDate',
            title: 'Abgabedatum',
            active: "selected"
        },
        {
            query: 'availableDate',
            title: 'Verfügbarkeitsdatum'
        },
        {
            query: 'createdAt',
            title: 'Erstelldatum'
        },
        {
            query: 'updatedAt',
            title: 'letze Aktualisierung'
        },
        {
            query: 'private',
            title: 'private Aufgabe'
        }        
    ];
};

const getCreateHandler = (service) => {
    return function (req, res, next) {
        if ((!req.body.courseId) || (req.body.courseId && req.body.courseId.length <= 2)) {
            req.body.courseId = null;
            req.body.private = true;
        }
        if ((!req.body.lessonId) || (req.body.lessonId && req.body.lessonId.length <= 2)) {
            req.body.lessonId = null;
        }
        if (req.body.dueDate) {
            // rewrite german format to ISO
            req.body.dueDate = moment(req.body.dueDate, 'DD.MM.YYYY HH:mm').toISOString();
        }

        if (req.body.availableDate) {
            // rewrite german format to ISO
            req.body.availableDate = moment(req.body.availableDate, 'DD.MM.YYYY HH:mm').toISOString();
        }

        if (!req.body.availableDate || !req.body.dueDate) {
            let now = new Date();
            if (!req.body.availableDate) {
                req.body.availableDate = now.toISOString();
            }
            if (!req.body.dueDate) {
                now.setFullYear(now.getFullYear() + 9);
                req.body.dueDate = now.toISOString();
            }
        }

        if(req.body.availableDate >= req.body.dueDate){
            req.session.notification = {
                type: 'danger',
                message: "Das Beginndatum muss vor dem Abgabedatum liegen!"
            };
            res.redirect(req.header('Referer'));
            return;
        }
        let referrer = (req.body.referrer)?
                            (req.body.referrer):
                            ((req.header('Referer').indexOf("homework/new") !== -1)?
                                "/homework":
                                req.header('Referer'));
        delete req.body.referrer;
        api(req).post('/' + service + '/', {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            if (data.courseId && !data.private && service == "homework") {
                api(req).get('/courses/' + data.courseId)
                    .then(course => {
                        sendNotification(data.courseId,
                            "Sie haben eine neue Hausaufgabe im Fach " + course.name, data.name + " ist bis zum " + moment(data.dueDate).format('DD.MM.YYYY HH:mm') + " abzugeben.",
                            data.teacherId,
                            req,
                            `${(req.headers.origin || process.env.HOST)}/homework/${data._id}`);
                    });
            }
            res.redirect(referrer);
        }).catch(err => {
            next(err);
        });
    };
};

const sendNotification = (courseId, title, message, userId, req, link) => {
    api(req).post('/notification/messages', {
        json: {
            "title": title,
            "body": message,
            "token": userId,
            "priority": "high",
            "action": link,
            "scopeIds": [
                courseId
            ]
        }
    });
};


const getUpdateHandler = (service) => {
    return function (req, res, next) {
        if (service == "homework"){
            if ((!req.body.courseId) || (req.body.courseId && req.body.courseId.length <= 2)) {
                req.body.courseId = null;
                req.body.private = true;
            }
            if ((!req.body.lessonId) || (req.body.lessonId && req.body.lessonId.length <= 2)) {
                req.body.lessonId = null;
            }
            if (!req.body.private) {
                req.body.private = false;
            }
            if (!req.body.publicSubmissions) {
                req.body.publicSubmissions = false;
            }

            // rewrite german format to ISO
            req.body.availableDate = moment(req.body.availableDate, 'DD.MM.YYYY HH:mm').toISOString();
            req.body.dueDate = moment(req.body.dueDate, 'DD.MM.YYYY HH:mm').toISOString();

            var referrer = req.body.referrer.replace("/edit","");
            delete req.body.referrer;

            if(req.body.availableDate >= req.body.dueDate){
                req.session.notification = {
                    type: 'danger',
                    message: "Das Beginndatum muss vor dem Abgabedatum liegen!"
                };
                res.redirect(referrer);
                return;
            }
        }
        if(service == "submissions"){
            req.body.grade = parseInt(req.body.grade);
        }
        api(req).patch('/' + service + '/' + req.params.id, {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            if (service == "submissions"){
                api(req).get('/homework/' + data.homeworkId, { qs: {$populate: ["courseId"]}})
                    .then(homework => {
                    sendNotification(data.studentId,
                        "Deine Abgabe im Fach " +
                        homework.courseId.name + " wurde bewertet",
                        " ",
                        data.studentId,
                        req,
                        `${(req.headers.origin || process.env.HOST)}/homework/${homework._id}`);
                    });

                res.redirect(req.header('Referrer'));
            }
            if(referrer){
                res.redirect(referrer);
            }else{
                res.sendStatus(200);
            }
        }).catch(err => {
            next(err);
        });
    };
};

const getDetailHandler = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id).then(
            data => {
                data.availableDate = moment(data.availableDate).format('DD.MM.YYYY HH:mm');
                data.dueDate = moment(data.dueDate).format('DD.MM.YYYY HH:mm');
                res.json(data);
            }).catch(err => {
            next(err);
        });
    };
};

const getImportHandler = (service) => {
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
router.patch('/:id', getUpdateHandler('homework'));
router.get('/:id/json', getDetailHandler('homework')); // may remove cause its unused
router.delete('/:id', getDeleteHandler('homework'));

router.get('/submit/:id/import', getImportHandler('submissions'));
router.patch('/submit/:id', getUpdateHandler('submissions'));
router.post('/submit', getCreateHandler('submissions'));

router.post('/submit/:id/files', function(req, res, next) {
   let submissionId = req.params.id;
   api(req).patch("/submissions/" + submissionId, {
       json: {
           $push: {
               fileIds: req.body.fileId
           }
       }
   })
       .then(result => res.json(result))
       .catch(err => res.send(err));
});

/** adds shared permission for teacher in the corresponding homework **/
router.post('/submit/:id/files/:fileId/permissions', function (req, res, next) {
    let submissionId = req.params.id;
    let fileId = req.params.fileId;
    let homeworkId = req.body.homeworkId;

    // if homework is already given, just fetch homework
    let homeworkPromise = homeworkId
        ? api(req).get('/homework/' + homeworkId)
        : api(req).get('/submissions/' + submissionId, {
        qs: {
            $populate: ['homeworkId'],
        }
        });
    let filePromise = api(req).get('/files/' + fileId);
    Promise.all([homeworkPromise, filePromise]).then(([homework, file]) => {
        let teacherId = homeworkId ? homework.teacherId : homework.homeworkId.teacherId;
        let newPermission = {
            userId: teacherId,
            permissions: ['can-read', 'can-write']
        };
        file.permissions.push(newPermission);

        api(req).patch('/files/' + file._id, {json: file}).then(result => res.json(result));
    }).catch(err => res.send(err));
});

router.delete('/submit/:id/files', function(req, res, next) {
    let submissionId = req.params.id;
    api(req).patch("/submissions/" + submissionId, {
        json: {
            $pull: {
                fileIds: req.body.fileId
            }
        }
    })
        .then(result => res.json(result))
        .catch(err => res.send(err));
});

router.post('/comment', getCreateHandler('comments'));
router.delete('/comment/:id', getDeleteHandlerR('comments'));


const splitDate = function (date) {
    const dateF = moment(date).format('DD.MM.YYYY');
    const timeF = moment(date).format('HH:mm');
    return {
        "timestamp": moment(date).valueOf(),
        "date": dateF,
        "time": timeF
    };
};

router.all('/', function (req, res, next) {
    var homeworkDesc = (req.query.desc == "true")?'-':'';
    var homeworkSort = (req.query.sort && req.query.sort!=="")?req.query.sort:'dueDate';

    var sortmethods = getSortmethods();
    if (req.query.sort && req.query.sort!=="") {
        // Aktueller Sortieralgorithmus für Anzeige aufbereiten
        sortmethods = sortmethods.map(function (e) {
            if (e.query == req.query.sort) {
                e.active = 'selected';
            } else {
                delete e['active'];
            }
            return e;
        });
    }

    api(req).get('/homework/', {
        qs: {
            $populate: ['courseId'],
            $sort: homeworkDesc+homeworkSort
        }
    }).then(homeworks => {
        homeworks = homeworks.data.map(assignment => { // alle Hausaufgaben aus DB auslesen
            // kein Kurs -> Private Hausaufgabe
            if (assignment.courseId == null) {
                assignment.color = "#1DE9B6";
                assignment.private = true;
            } else {
                if (!assignment.private) {
                    assignment.userIds = assignment.courseId.userIds;
                }
                // Kursfarbe setzen
                assignment.color = assignment.courseId.color;
            }

            assignment.url = '/homework/' + assignment._id;
            assignment.privateclass = assignment.private ? "private" : ""; // Symbol für Private Hausaufgabe anzeigen?

            assignment.currentUser = res.locals.currentUser;
            assignment.actions = getActions(assignment, '/homework/');
            if(assignment.teacherId != res.locals.currentUser._id){
                assignment.stats = undefined;
            }
            return assignment;
        });

        const coursesPromise = getSelectOptions(req, 'courses', {
            $or: [
                {userIds: res.locals.currentUser._id},
                {teacherIds: res.locals.currentUser._id}
            ]
        });
        Promise.resolve(coursesPromise).then(courses => {
            // ist der aktuelle Benutzer ein Schueler? -> Für Modal benötigt
            const userPromise = getSelectOptions(req, 'users', {
                _id: res.locals.currentUser._id,
                $populate: ['roles']
            });
            Promise.resolve(userPromise).then(user => {
                const roles = user[0].roles.map(role => {
                    return role.name;
                });
                let isStudent = true;
                if (roles.indexOf('student') == -1) {
                    isStudent = false;
                }
                // Render Overview
                //Pagination in client, because filters are in afterhook
                const itemsPerPage = 10;
                const currentPage = parseInt(req.query.p) || 1;
                let pagination = {
                    currentPage,
                    numPages: Math.ceil(homeworks.length / itemsPerPage),
                    baseUrl: '/homework/?'
                                        +((req.query.sort)?('sort='+req.query.sort+'&'):'')
                                        +((homeworkDesc)?('desc='+req.query.desc+'&'):'')+'p={{page}}'
                };
                const end = currentPage * itemsPerPage;
                homeworks = homeworks.slice(end - itemsPerPage, end);
                //Render overview
                res.render('homework/overview', {
                    title: 'Meine Aufgaben',
                    pagination,
                    homeworks,
                    courses,
                    isStudent,
                    sortmethods,
                    desc: homeworkDesc
                });
            });
        });
    });
});

router.get('/new', function (req, res, next) {
    const coursesPromise = getSelectOptions(req, 'courses', {
        $or: [
            {userIds: res.locals.currentUser._id},
            {teacherIds: res.locals.currentUser._id}
        ]
    });
    Promise.resolve(coursesPromise).then(courses => {
        const lessonsPromise = getSelectOptions(req, 'lessons', {
            courseId: req.query.course
        });
        Promise.resolve(lessonsPromise).then(lessons => {
            // ist der aktuelle Benutzer ein Schueler? -> Für Modal benötigt
            const userPromise = getSelectOptions(req, 'users', {
                _id: res.locals.currentUser._id,
                $populate: ['roles']
            });
            Promise.resolve(userPromise).then(user => {
                const roles = user[0].roles.map(role => {
                    return role.name;
                });
                let isStudent = true;
                if (roles.indexOf('student') == -1) {
                    isStudent = false;
                }

                let assignment={"private":(req.query.private == 'true')};
                if(req.query.course){assignment["courseId"] = {"_id":req.query.course};}
                if(req.query.topic){assignment["lessonId"] = req.query.topic;}
                //Render overview
                res.render('homework/edit', {
                    title: 'Aufgabe hinzufügen',
                    submitLabel: 'Hinzufügen',
                    closeLabel: 'Schließen',
                    method: 'post',
                    action: '/homework/',
                    referrer: req.header('Referer'),
                    assignment,
                    courses,
                    lessons: (req.query.course)?lessons:false,
                    isStudent
                });
            });
        });
    });
});

router.get('/:assignmentId/edit', function (req, res, next) {
    api(req).get('/homework/' + req.params.assignmentId, {
        qs: {
            $populate: ['courseId']
        }
    }).then(assignment => {
        assignment.availableDate = moment(assignment.availableDate).format('DD.MM.YYYY HH:mm');
        assignment.dueDate = moment(assignment.dueDate).format('DD.MM.YYYY HH:mm');
    
        const coursesPromise = getSelectOptions(req, 'courses', {
            $or: [
                {userIds: res.locals.currentUser._id},
                {teacherIds: res.locals.currentUser._id}
            ]
        });
        Promise.resolve(coursesPromise).then(courses => {
            // ist der aktuelle Benutzer ein Schueler? -> Für Modal benötigt
            const userPromise = getSelectOptions(req, 'users', {
                _id: res.locals.currentUser._id,
                $populate: ['roles']
            });
            Promise.resolve(userPromise).then(user => {
                const roles = user[0].roles.map(role => {
                    return role.name;
                });
                let isStudent = true;
                if (roles.indexOf('student') == -1) {
                    isStudent = false;
                }
                if(assignment.courseId && assignment.courseId._id){
                    const lessonsPromise = getSelectOptions(req, 'lessons', {
                        courseId: assignment.courseId._id
                    });
                    Promise.resolve(lessonsPromise).then(lessons => {
                        //Render overview
                        res.render('homework/edit', {
                            title: 'Aufgabe bearbeiten',
                            submitLabel: 'Speichern',
                            closeLabel: 'Schließen',
                            method: 'patch',
                            action: '/homework/'+req.params.assignmentId,
                            referrer: '/homework/'+req.params.assignmentId,
                            assignment,
                            courses,
                            lessons,
                            isStudent
                        });
                    });
                }else{
                    //Render overview
                    res.render('homework/edit', {
                        title: 'Aufgabe hinzufügen',
                        submitLabel: 'Speichern',
                        closeLabel: 'Schließen',
                        method: 'patch',
                        action: '/homework/'+req.params.assignmentId,
                        referrer: '/homework/'+req.params.assignmentId,
                        assignment,
                        courses,
                        lessons: false,
                        isStudent
                    });
                }
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
            homeworkId: assignment._id,
            $populate: ['homeworkId', 'fileIds']
        });
        Promise.resolve(submissionPromise).then(submissions => {
            // Kursfarbe setzen
            assignment.color = (assignment.courseId && assignment.courseId.color)?assignment.courseId.color:"#1DE9B6";

            // Datum aufbereiten
            const availableDateArray = splitDate(assignment.availableDate);
            assignment.availableDateF = availableDateArray["date"];
            assignment.availableTimeF = availableDateArray["time"];

            const dueDateArray = splitDate(assignment.dueDate);
            assignment.dueDateF = dueDateArray["date"];
            assignment.dueTimeF = dueDateArray["time"];

            // Abgabe noch möglich?
            if (new Date(assignment.dueDate).getTime() < Date.now()) {
                assignment.submittable = false;
            } else {
                assignment.submittable = true;
            }
            assignment.submission = submissions[0];

            // Abgabenübersicht anzeigen (Lehrer || publicSubmissions) -> weitere Daten berechnen
            if (!assignment.private && (assignment.teacherId == res.locals.currentUser._id && assignment.courseId != null || assignment.publicSubmissions)) {
                // Daten für Abgabenübersicht
                assignment.submissions = submissions;

                // Alle Teilnehmer des Kurses 
                const coursePromise = getSelectOptions(req, 'courses', {
                    _id: assignment.courseId._id,
                    $populate: ['userIds']
                });

                Promise.resolve(coursePromise).then(course => {
                    var students = course[0].userIds;
                    students = students.map(student => {
                        return {
                            student: student,
                            submission: assignment.submissions.filter(function (n) {
                                return n.studentId == student._id;
                            })[0]
                        };
                    });
                    // Kommentare zu Abgaben auslesen
                    const ids = assignment.submissions.map(n => n._id);
                    const commentPromise = getSelectOptions(req, 'comments', {
                        submissionId: {$in: ids},
                        $populate: ['author']
                    });
                    Promise.resolve(commentPromise).then(comments => {
                        // -> Kommentare stehen nun in comments
                        // ist der aktuelle Benutzer Schüler?
                        const userPromise = getSelectOptions(req, 'users', {
                            _id: res.locals.currentUser._id,
                            $populate: ['roles']
                        });
                        Promise.resolve(userPromise).then(user => {
                            const roles = user[0].roles.map(role => {
                                return role.name;
                            });
                            let isStudent = true;
                            if (roles.indexOf('student') == -1) {
                                isStudent = false;
                            }
                            // Render assignment.hbs
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
                                isStudent,
                                comments
                            }));
                        });
                    });

                });
            } else {
                // file upload path, todo: maybe use subfolders
                let submissionUploadPath = `users/${res.locals.currentUser._id}/`;

                if(assignment.submission){

                    // Kommentare zu Abgabe auslesen
                    const commentPromise = getSelectOptions(req, 'comments', {
                        submissionId: {$in: assignment.submission._id},
                        $populate: ['author']
                    });
                    Promise.resolve(commentPromise).then(comments => {
                        // -> Kommentare stehen nun in comments
                        // alle Kurse von aktuellem Benutzer auslesen
                        const coursesPromise = getSelectOptions(req, 'courses', {
                            $or: [
                                {userIds: res.locals.currentUser._id},
                                {teacherIds: res.locals.currentUser._id}
                            ]
                        });
                        Promise.resolve(coursesPromise).then(courses => {
                        // -> Kurse stehen nun in courses
                            res.render('homework/assignment', Object.assign({}, assignment, {
                                title: (assignment.courseId == null) ? assignment.name : (assignment.courseId.name + ' - ' + assignment.name),
                                breadcrumb: [
                                    {
                                        title: 'Meine Aufgaben',
                                        url: '/homework'
                                    },
                                    {}
                                ],
                                comments,
                                courses,
                                path: submissionUploadPath
                            }));
                        });
                    });
                }else{
                    res.render('homework/assignment', Object.assign({}, assignment, {
                        title: (assignment.courseId == null) ? assignment.name : (assignment.courseId.name + ' - ' + assignment.name),
                        breadcrumb: [
                            {
                                title: 'Meine Aufgaben',
                                url: '/homework'
                            },
                            {}
                        ],
                        path: submissionUploadPath
                    })); 
                }
            }
        });
    });
});

module.exports = router;
