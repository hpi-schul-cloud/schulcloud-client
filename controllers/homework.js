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
            method: 'delete-material',
            alt: 'Löschen'
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

        if (req.body.availableDate >= req.body.dueDate) {
            req.session.notification = {
                type: 'danger',
                message: "Das Beginndatum muss vor dem Abgabedatum liegen!"
            };
            res.redirect(req.header('Referer'));
            return;
        }
        let referrer = (req.body.referrer) ?
            (req.body.referrer) :
            ((req.header('Referer').indexOf("homework/new") !== -1) ?
                "/homework" :
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
    if (process.env.NOTIFICATION_SERVICE_ENABLED) {
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
    }
};

const patchFunction = function(service, req, res, next){
    if(req.body.referrer){
        var referrer = req.body.referrer.replace("/edit","");
        delete req.body.referrer;
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
}
const getUpdateHandler = (service) => {
    return function (req, res, next) {
        if (service == "homework"){
            //check archived
            if(req.body.archive){
                api(req).get('/homework/' + req.params.id, {}).then(homework => {
                    if(homework.archived.includes(res.locals.currentUser._id) && req.body.archive == "open"){
                        homework.archived.splice(homework.archived.indexOf(res.locals.currentUser._id), 1);
                    }else if(!homework.archived.includes(res.locals.currentUser._id) && req.body.archive == "done"){
                        homework.archived.push(res.locals.currentUser._id);
                    }
                    req.body.archived = homework.archived;
                    delete req.body.archive;
                    return patchFunction(service, req, res, next);
                });
            }else{
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
                if (!req.body.teamSubmissions) {
                    req.body.teamSubmissions = false;
                }
                // rewrite german format to ISO
                if(req.body.availableDate){
                    req.body.availableDate = moment(req.body.availableDate, 'DD.MM.YYYY HH:mm').toISOString();
                }
                if(req.body.dueDate){
                    req.body.dueDate = moment(req.body.dueDate, 'DD.MM.YYYY HH:mm').toISOString();
                }
                if(req.body.availableDate && req.body.dueDate && req.body.availableDate >= req.body.dueDate){
                    req.session.notification = {
                        type: 'danger',
                        message: "Das Beginndatum muss vor dem Abgabedatum liegen!"
                    };
                    if(req.body.referrer){
                        var referrer = req.body.referrer.replace("/edit","");
                        delete req.body.referrer;
                    }
                    res.redirect(referrer);
                    return;
                }
                return patchFunction(service, req, res, next);
            }
        }else{
            if(service == "submissions"){
                req.body.grade = parseInt(req.body.grade);
            }
            return patchFunction(service, req, res, next);
        }

        if (service == "submissions") {
            req.body.grade = parseInt(req.body.grade);
        }
        api(req).patch('/' + service + '/' + req.params.id, {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            if (service == "submissions") {
                api(req).get('/homework/' + data.homeworkId, {qs: {$populate: ["courseId"]}})
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
            if (referrer) {
                res.redirect(referrer);
            } else {
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
router.delete('/:id', getDeleteHandler('homework'));

router.get('/submit/:id/import', getImportHandler('submissions'));
router.patch('/submit/:id', getUpdateHandler('submissions'));
router.post('/submit', getCreateHandler('submissions'));

router.post('/submit/:id/files', function (req, res, next) {
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

router.delete('/submit/:id/files', function (req, res, next) {
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
    return {
        "timestamp": moment(date).valueOf(),
        "date": moment(date).format('DD.MM.YYYY'),
        "time": moment(date).format('HH:mm')
    };
};

const overview = (title = "") => {
    return function (req, res, next) {
        var homeworkDesc = (req.query.desc == "true") ? '-' : '';
        var homeworkSort = (req.query.sort && req.query.sort !== "") ? req.query.sort : 'dueDate';

        var sortmethods = getSortmethods();
        if (req.query.sort && req.query.sort !== "") {
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

        let query = {
            $populate: ['courseId'],
            $sort: homeworkDesc + homeworkSort,
            archived : {$ne: res.locals.currentUser._id }
        };
        if (req._parsedUrl.pathname.includes("private")) {
            query.private = true;
        }
        if (req._parsedUrl.pathname.includes("asked")) {
            query.private = {$ne: true};
        }

        if (req._parsedUrl.pathname.includes("archive")) {
            query.archived = res.locals.currentUser._id;
        }

        api(req).get('/homework/', {
            qs: query
        }).then(homeworks => {
            // ist der aktuelle Benutzer ein Schueler? -> Für Modal benötigt
            api(req).get('/users/' + res.locals.currentUser._id, {
                qs: {
                    $populate: ['roles']
                }
            }).then(user => {
                const isStudent = (user.roles.map(role => {return role.name;}).indexOf('student') != -1);

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
                    // Schüler sehen Beginndatum nicht in der Übersicht über gestellte Aufgaben (übersichtlicher)
                    if(!assignment.private && isStudent){
                        delete assignment.availableDate;
                    }

                    assignment.url = '/homework/' + assignment._id;
                    assignment.privateclass = assignment.private ? "private" : ""; // Symbol für Private Hausaufgabe anzeigen?

                    assignment.currentUser = res.locals.currentUser;
                    assignment.actions = getActions(assignment, '/homework/');
                    if (assignment.teacherId != res.locals.currentUser._id) {
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
                    //Pagination in client, because filters are in afterhook
                    const itemsPerPage = 10;
                    const currentPage = parseInt(req.query.p) || 1;
                    let pagination = {
                        currentPage,
                        numPages: Math.ceil(homeworks.length / itemsPerPage),
                        baseUrl: req.baseUrl + req._parsedUrl.pathname + '/?'
                        + ((req.query.sort) ? ('sort=' + req.query.sort + '&') : '')
                        + ((homeworkDesc) ? ('desc=' + req.query.desc + '&') : '') + 'p={{page}}'
                    };
                    const end = currentPage * itemsPerPage;
                    homeworks = homeworks.slice(end - itemsPerPage, end);
                    //Render overview
                    res.render('homework/overview', {
                        title: title + ' Aufgaben',
                        pagination,
                        homeworks,
                        courses,
                        isStudent,
                        sortmethods,
                        desc: homeworkDesc,
                        addButton: (req._parsedUrl.pathname == "/" 
                                || req._parsedUrl.pathname.includes("private") 
                                || (req._parsedUrl.pathname.includes( "asked" ) 
                                    && !isStudent ) 
                               )
                    });
                });
            });
        }).catch(err => {
            next(err);
        });
    };
};
router.get('/', overview(""));
router.get('/asked', overview("Gestellte"));
router.get('/private', overview("Meine"));
router.get('/archive', overview("Archivierte"));

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

                let assignment = {"private": (req.query.private == 'true')};
                if (req.query.course) {
                    assignment["courseId"] = {"_id": req.query.course};
                }
                if (req.query.topic) {
                    assignment["lessonId"] = req.query.topic;
                }
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
                    lessons: (req.query.course) ? lessons : false,
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
                if (assignment.courseId && assignment.courseId._id) {
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
                            action: '/homework/' + req.params.assignmentId,
                            referrer: '/homework/' + req.params.assignmentId,
                            assignment,
                            courses,
                            lessons,
                            isStudent
                        });
                    });
                } else {
                    //Render overview
                    res.render('homework/edit', {
                        title: 'Aufgabe hinzufügen',
                        submitLabel: 'Speichern',
                        closeLabel: 'Schließen',
                        method: 'patch',
                        action: '/homework/' + req.params.assignmentId,
                        referrer: '/homework/' + req.params.assignmentId,
                        assignment,
                        courses,
                        lessons: false,
                        isStudent
                    });
                }
            });
        });
    }).catch(err => {
        next(err);
    });
});

router.get('/:assignmentId', function (req, res, next) {
    api(req).get('/homework/' + req.params.assignmentId, {
        qs: {
            $populate: ['courseId']
        }
    }).then(assignment => {
        // Kursfarbe setzen
        assignment.color = (assignment.courseId && assignment.courseId.color) ? assignment.courseId.color : "#1DE9B6";

        // Datum aufbereiten
        const availableDateArray = splitDate(assignment.availableDate);
        assignment.availableDateF = availableDateArray["date"];
        assignment.availableTimeF = availableDateArray["time"];

        const dueDateArray = splitDate(assignment.dueDate);
        assignment.dueDateF = dueDateArray["date"];
        assignment.dueTimeF = dueDateArray["time"];

        // Abgabe noch möglich?
        assignment.submittable = (dueDateArray["timestamp"] >= Date.now());

        const breadcrumbTitle = ((assignment.archived || []).includes(res.locals.currentUser._id))
            ? ("Archivierte")
            : ((assignment.private)
                ? ("Meine")
                : ("Gestellte"));
        const breadcrumbUrl = ((assignment.archived || []).includes(res.locals.currentUser._id))
            ? ("/homework/archive")
            : ((assignment.private)
                ? ("/homework/private")
                : ("/homework/asked"));
                
        Promise.all([
            // Abgaben auslesen
            api(req).get('/submissions/', {
                qs: {
                    homeworkId: assignment._id,
                    $populate: ['homeworkId', 'fileIds']
                }
            }),
            // Alle Teilnehmer des Kurses 
            api(req).get('/courses/' + assignment.courseId._id, {
                qs: {
                    $populate: ['userIds']
                }
            })
        ]).then(([submissions, course]) => {
            assignment.submission = submissions.data.filter(submission => {
                return (submission.studentId == res.locals.currentUser._id)
                     ||(submission.coWorkers.includes(res.locals.currentUser._id));
            })[0];
            const students = course.userIds;
            // Abgabenübersicht anzeigen (Lehrer || publicSubmissions) -> weitere Daten berechnen
            if (!assignment.private && (assignment.teacherId == res.locals.currentUser._id && assignment.courseId != null || assignment.publicSubmissions)) {
                // Daten für Abgabenübersicht
                assignment.submissions = submissions.data;

                const studentSubmissions = students.map(student => {
                    return {
                        student: student,
                        submission: assignment.submissions.filter(submission => {
                            return (submission.studentId == student._id)
                                 ||(submission.coWorkers.includes(res.locals.currentUser._id));
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
                        // Render assignment.hbs
                        res.render('homework/assignment', Object.assign({}, assignment, {
                            title: assignment.courseId.name + ' - ' + assignment.name,
                            breadcrumb: [
                                {
                                    title: breadcrumbTitle + " Aufgaben",
                                    url: breadcrumbUrl
                                },
                                {}
                            ],
                            students:true,
                            studentSubmissions,
                            comments
                        }));
                    });
                });
            } else {
                // file upload path, todo: maybe use subfolders
                let submissionUploadPath = `users/${res.locals.currentUser._id}/`;

                if (assignment.submission) {

                    // Kommentare zu Abgabe auslesen
                    const commentPromise = getSelectOptions(req, 'comments', {
                        submissionId: assignment.submission._id,
                        $populate: ['author']
                    });
                    Promise.resolve(commentPromise).then(comments => {
                        // -> Kommentare stehen nun in comments
                        res.render('homework/assignment', Object.assign({}, assignment, {
                            title: (assignment.courseId == null) ? assignment.name : (assignment.courseId.name + ' - ' + assignment.name),
                            breadcrumb: [
                                {
                                    title: breadcrumbTitle + " Aufgaben",
                                    url: breadcrumbUrl
                                },
                                {}
                            ],
                            comments,
                            students,
                            path: submissionUploadPath
                        }));
                    });
                } else {
                    res.render('homework/assignment', Object.assign({}, assignment, {
                        title: (assignment.courseId == null) ? assignment.name : (assignment.courseId.name + ' - ' + assignment.name),
                        breadcrumb: [
                            {
                                title: breadcrumbTitle + " Aufgaben",
                                url: breadcrumbUrl
                            },
                            {}
                        ],
                        students,
                        path: submissionUploadPath
                    }));
                }
            }
        });
    }).catch(err => {
        next(err);
    });
});

module.exports = router;
