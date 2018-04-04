﻿/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const handlebars = require("handlebars");
const moment = require("moment");
const _ = require("lodash");

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

const getCreateHandler = (service) => {
    return function (req, res, next) {
        if(service=="homework"){
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
        }
        if (req.body.teamMembers && typeof req.body.teamMembers == "string") {
            req.body.teamMembers = [req.body.teamMembers];
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
            if (data.courseId && !data.private && service === "homework") {
                api(req).get('/courses/' + data.courseId)
                    .then(course => {
                        sendNotification(data.courseId,
                            "Sie haben eine neue Hausaufgabe im Fach " + course.name, data.name + " ist bis zum " + moment(data.dueDate).format('DD.MM.YYYY HH:mm') + " abzugeben.",
                            data.teacherId,
                            req,
                            `${(req.headers.origin || process.env.HOST)}/homework/${data._id}`);
                    });
            }
            let promise = service === "submissions" ?
                addFilePermissionsForTeamMembers(req, data.teamMembers, data.fileIds) :
                Promise.resolve({});

            return promise.then(_ => {
                res.redirect(referrer);
            });
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

/**
 * adds file permissions for co workers to a submission file
 */
const addFilePermissionsForTeamMembers = (req, teamMembers, fileIds) => {
    return Promise.all(fileIds.map(f => {
        return api(req).get('/files/' + f).then(file => {
            return Promise.all(teamMembers.map(cw => {
                let isAlreadyInside = _.filter(file.permissions, f => {
                    return JSON.stringify(f.userId) === JSON.stringify(cw);
                }).length > 0;

                !isAlreadyInside ? file.permissions.push({
                    userId: cw,
                    permissions: ['can-read', 'can-write']
                }) : '';

                return file;
            })).then(_ => {
                return api(req).patch('/files/' + file._id, {json: file});
            });
        });
    }));
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
        if (service === "submissions"){
            // add file permissions for co Worker
            let fileIds = data.fileIds;
            let teamMembers = data.teamMembers;
            return addFilePermissionsForTeamMembers(req, teamMembers, fileIds).then(_ => {
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
            });
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
            }
        }else{
            if(service == "submissions"){
                if (req.body.teamMembers && typeof req.body.teamMembers == "string") {
                    req.body.teamMembers = [req.body.teamMembers];
                }
                if(req.body.grade){
                    req.body.grade = parseInt(req.body.grade);
                }
            }
        }
        return patchFunction(service, req, res, next);
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
            res.sendStatus(200);
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
router.delete('/submit/:id', getDeleteHandlerR('submissions'));
router.get('/submit/:id/delete', getDeleteHandlerR('submissions'));

router.post('/submit/:id/files', function (req, res, next) {
    let submissionId = req.params.id;
    api(req).patch("/submissions/" + submissionId, {
        json: {
            $push: {
                fileIds: req.body.fileId,
            },
            $set: {
                teamMembers: req.body.teamMembers || [res.locals.currentUser._id]
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
    let teamMembers = req.body.teamMembers;

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

        return api(req).patch('/files/' + file._id, {json: file}).then(result => res.json(result)).then(_ => {
            // if there is already an submission, it is more safe to add the permissions at this step (if the user
            // forgets to click on save)
            return teamMembers ? addFilePermissionsForTeamMembers(req, teamMembers, [fileId]) : Promise.resolve({});
        });
    }).catch(err => res.send(err));
});

router.delete('/submit/:id/files', function (req, res, next) {
    let submissionId = req.params.id;
    api(req).patch("/submissions/" + submissionId, {
        json: {
            $pull: {
                fileIds: req.body.fileId
            },
            $set: {
                teamMembers: req.body.teamMembers || [res.locals.currentUser._id]
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

        let query = {
            $populate: ['courseId'],
            archived : {$ne: res.locals.currentUser._id }
        };

        const tempOrgQuery = (req.query||{}).filterQuery;
        const filterQueryString = (tempOrgQuery)?('&filterQuery='+ escape(tempOrgQuery)):'';

        let itemsPerPage = 10;
        if(tempOrgQuery){
            const filterQuery = JSON.parse(unescape(req.query.filterQuery));
            if (filterQuery["$limit"]) {
                itemsPerPage = filterQuery["$limit"];
            }
            query = Object.assign(query, filterQuery);
        }else{
            if (req._parsedUrl.pathname.includes("private")) {
                query.private = true;
            }
            if (req._parsedUrl.pathname.includes("asked")) {
                query.private = {$ne: true};
            }
        }
        if (req._parsedUrl.pathname.includes("archive")) {
            query.archived = res.locals.currentUser._id;
        }
        api(req).get('/homework/', {
            qs: query
        }).then(homeworks => {
            // ist der aktuelle Benutzer ein Schueler? -> Für Sichtbarkeit von Daten benötigt
            api(req).get('/users/' + res.locals.currentUser._id, {
                qs: {
                    $populate: ['roles','courseId']
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

                    assignment.isSubstitution = !assignment.private && ((assignment.courseId||{}).substitutionIds||[]).includes(assignment.currentUser._id.toString());
                    assignment.isTeacher = assignment.isSubstitution
                                         ||((assignment.courseId||{}).teacherIds||[]).includes(assignment.currentUser._id.toString())
                                         ||assignment.teacherId == res.locals.currentUser._id;
                    assignment.actions = getActions(assignment, '/homework/');
                    if (!assignment.isTeacher) {
                        assignment.stats = undefined;
                    }
                    return assignment;
                });

                const coursesPromise = getSelectOptions(req, 'courses', {
                    $or: [
                        {userIds: res.locals.currentUser._id},
                        {teacherIds: res.locals.currentUser._id},
                        {substitutionIds: res.locals.currentUser._id}
                    ]
                });
                Promise.resolve(coursesPromise).then(courses => {
                    const courseList = courses.map(course => {
                        return [course._id, course.name];
                    });
                    const filterSettings =
                        [{
                            type: "sort",
                            title: 'Sortierung',
                            displayTemplate: 'Sortieren nach: %1',
                            options: [
                                ["createdAt", "Erstelldatum"],
                                ["updatedAt", "letze Aktualisierung"],
                                ["availableDate", "Verfügbarkeitsdatum"],
                                ["dueDate", "Abgabedatum"]
                            ],
                            defaultSelection: "dueDate"
                        },
                        {
                            type: "select",
                            title: 'Kurse',
                            displayTemplate: 'Kurse: %1',
                            property: 'courseId',
                            multiple: true,
                            expanded: true,
                            options: courseList
                        },
                        {
                            type: "date",
                            title: 'Abgabedatum',
                            displayTemplate: 'Abgabe vom %1 bis %2',
                            property: 'dueDate',
                            mode: 'fromto',
                            fromLabel: 'vom',
                            toLabel: 'bis'
                        },
                        {
                            type: "boolean",
                            title: 'Mehr',
                            options: {
                                "private": "private Aufgabe",
                                "publicSubmissions": "Schüler können Abgaben untereinander sehen",
                                "teamSubmissions": "Teamabgaben"
                            },
                            defaultSelection: {
                                "private": ((query.private !== undefined)?((query.private === true)?true:false):undefined)
                            },
                            applyNegated: {
                                "private": [true, false],
                                "publicSubmissions": [true, false],
                                "teamSubmissions": [true, false]
                            }
                        }];
                    //Pagination in client, because filters are in afterhook
                    const currentPage = parseInt(req.query.p) || 1;
                    let pagination = {
                        currentPage,
                        numPages: Math.ceil(homeworks.length / itemsPerPage),
                        baseUrl: req.baseUrl + req._parsedUrl.pathname + '?'
                        + 'p={{page}}' + filterQueryString
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
                        filterSettings: JSON.stringify(filterSettings),
                        addButton: (req._parsedUrl.pathname == "/"
                                || req._parsedUrl.pathname.includes("private")
                                || (req._parsedUrl.pathname.includes( "asked" )
                                    && !isStudent )
                               ),
                       createPrivate: req._parsedUrl.pathname.includes("private") || isStudent
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
            {teacherIds: res.locals.currentUser._id},
            {substitutionIds: res.locals.currentUser._id}
        ]
    });
    Promise.resolve(coursesPromise).then(courses => {
        courses.sort((a,b)=>{return (a.name.toUpperCase() < b.name.toUpperCase())?-1:1;});
        const lessonsPromise = getSelectOptions(req, 'lessons', {
            courseId: req.query.course
        });
        Promise.resolve(lessonsPromise).then(lessons => {
            (lessons || []).sort((a,b)=>{return (a.name.toUpperCase() < b.name.toUpperCase())?-1:1;});
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
                    closeLabel: 'Abbrechen',
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
        const isTeacher = (assignment.teacherId == res.locals.currentUser._id) || ((assignment.courseId||{}).teacherIds||[]).includes(res.locals.currentUser._id);
        const isSubstitution = ((assignment.courseId||{}).substitutionIds||[]).includes(res.locals.currentUser._id);
        if(!isTeacher && !isSubstitution){
            let error = new Error("You don't have permissions!");
            error.status = 403;
            return next(error);
        }

        assignment.availableDate = moment(assignment.availableDate).format('DD.MM.YYYY HH:mm');
        assignment.dueDate = moment(assignment.dueDate).format('DD.MM.YYYY HH:mm');

        const coursesPromise = getSelectOptions(req, 'courses', {
            $or: [
                {userIds: res.locals.currentUser._id},
                {teacherIds: res.locals.currentUser._id},
                {substitutionIds: res.locals.currentUser._id}
            ]
        });
        Promise.resolve(coursesPromise).then(courses => {
            courses.sort((a,b)=>{return (a.name.toUpperCase() < b.name.toUpperCase())?-1:1;});
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
                        (lessons || []).sort((a,b)=>{return (a.name.toUpperCase() < b.name.toUpperCase())?-1:1;});
                        res.render('homework/edit', {
                            title: 'Aufgabe bearbeiten',
                            submitLabel: 'Speichern',
                            closeLabel: 'Abbrechen',
                            method: 'patch',
                            action: '/homework/' + req.params.assignmentId,
                            referrer: '/homework/' + req.params.assignmentId,
                            assignment,
                            courses,
                            lessons,
                            isStudent,
                            isSubstitution
                        });
                    });
                } else {
                    res.render('homework/edit', {
                        title: 'Aufgabe hinzufügen',
                        submitLabel: 'Speichern',
                        closeLabel: 'Abbrechen',
                        method: 'patch',
                        action: '/homework/' + req.params.assignmentId,
                        referrer: '/homework/' + req.params.assignmentId,
                        assignment,
                        courses,
                        lessons: false,
                        isStudent,
                        isSubstitution
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

        // file upload path, todo: maybe use subfolders
        let submissionUploadPath = `users/${res.locals.currentUser._id}/`;

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
        let promises = [
            // Abgaben auslesen
            api(req).get('/submissions/', {
                qs: {
                    homeworkId: assignment._id,
                    $populate: ['homeworkId','fileIds','teamMembers','studentId']
                }
            }),
        ];
        if(assignment.courseId && assignment.courseId._id){
            promises.push(
                // Alle Teilnehmer des Kurses
                api(req).get('/courses/' + assignment.courseId._id, {
                    qs: {
                        $populate: ['userIds']
                    }
                })
            );
        }
        Promise.all(promises).then((values) => {
            let submissions = (values[0]||{});
            assignment.submission = submissions.data.map(submission => {
                submission.teamMemberIds = submission.teamMembers.map(e => {return e._id;});
                return submission;
            }).filter(submission => {
                return ((submission.studentId||{})._id == res.locals.currentUser._id)
                     ||(submission.teamMemberIds.includes(res.locals.currentUser._id.toString()));
            })[0];
            const students = ((values[1]||{}).userIds || []).filter(user => {return (user.firstName && user.lastName);})
                                                            .sort((a,b)=>{return (a.lastName.toUpperCase()  < b.lastName.toUpperCase())?-1:1;})
                                                            .sort((a,b)=>{return (a.firstName.toUpperCase() < b.firstName.toUpperCase())?-1:1;});
            // Abgabenübersicht anzeigen (Lehrer || publicSubmissions) -> weitere Daten berechnen
            if (!assignment.private
                && ((assignment.teacherId == res.locals.currentUser._id
                    || ((assignment.courseId||{}).teacherIds||[]).includes(res.locals.currentUser._id)
                    || ((assignment.courseId||{}).substitutionIds||[]).includes(res.locals.currentUser._id))
                && assignment.courseId != null || assignment.publicSubmissions)) {
                // Daten für Abgabenübersicht
                assignment.submissions = submissions.data.filter(submission => {return submission.studentId;})
                                                         .sort((a,b)=>{return (a.studentId.lastName.toUpperCase()  < b.studentId.lastName.toUpperCase())?-1:1;})
                                                         .sort((a,b)=>{return (a.studentId.firstName.toUpperCase() < b.studentId.firstName.toUpperCase())?-1:1;})
                                                         .map(sub => {
                                                             sub.teamMembers.sort((a,b)=>{return (a.lastName.toUpperCase()  < b.lastName.toUpperCase())?-1:1;})
                                                                            .sort((a,b)=>{return (a.firstName.toUpperCase() < b.firstName.toUpperCase())?-1:1;});
                                                             return sub;
                                                         });
                let studentSubmissions = students.map(student => {
                    return {
                        student: student,
                        submission: assignment.submissions.filter(submission => {
                            return (submission.studentId._id == student._id)
                                 ||(submission.teamMembers && submission.teamMembers.includes(student._id.toString()));
                        })[0]
                    };
                });
                /*studentSubmissions.sort((a,b)=>{return (a.student.lastName.toUpperCase()  < b.student.lastName.toUpperCase())?-1:1;})
                                  .sort((a,b)=>{return (a.student.firstName.toUpperCase() < b.student.firstName.toUpperCase())?-1:1;});
                */
                let studentsWithSubmission = [];
                assignment.submissions.forEach(e => {
                    if(e.teamMembers){
                        e.teamMembers.forEach( c => {
                            studentsWithSubmission.push(c._id.toString());
                        });
                    }else{
                        studentsWithSubmission.push(e.studentId.toString());
                    }
                });
                let studentsWithoutSubmission = [];
                assignment.courseId.userIds.forEach(e => {
                    if(!studentsWithSubmission.includes(e.toString())){
                        studentsWithoutSubmission.push(
                            studentSubmissions.filter(s => {
                                return (s.student._id.toString() == e.toString());
                            }).map(s => {
                                return s.student;
                            })[0]
                        );
                    }
                });
                studentsWithoutSubmission.sort((a,b)=>{return (a.lastName.toUpperCase()  < b.lastName.toUpperCase())?-1:1;})
                                         .sort((a,b)=>{return (a.firstName.toUpperCase() < b.firstName.toUpperCase())?-1:1;});
                /*
                // Kommentare zu Abgaben auslesen
                const ids = assignment.submissions.map(n => n._id);
                const commentPromise = getSelectOptions(req, 'comments', {
                    submissionId: {$in: ids},
                    $populate: ['author']
                });
                Promise.resolve(commentPromise).then(comments => {
                */
                    const comments = [];
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
                        assignment.submissions = assignment.submissions.map(s => {return {submission: s}; });
                        res.render('homework/assignment', Object.assign({}, assignment, {
                            title: assignment.courseId.name + ' - ' + assignment.name,
                            breadcrumb: [
                                {
                                    title: breadcrumbTitle + " Aufgaben",
                                    url: breadcrumbUrl
                                },
                                {}
                            ],
                            students:students,
                            studentSubmissions,
                            studentsWithoutSubmission,
                            path: submissionUploadPath,
                            comments
                        }));
                    });
                //});
            } else { // normale Schüleransicht
                /*
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
                */
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
                //}
            }
        });
    }).catch(err => {
        next(err);
    });
});

module.exports = router;