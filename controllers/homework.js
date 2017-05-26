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
            link: path + item._id + "/json",
            class: 'btn-edit',
            icon: 'edit',
            alt:'bearbeiten'
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

        if(req.body.dueDate) {
            // rewrite german format to ISO
            req.body.dueDate = moment(req.body.dueDate, 'DD.MM.YYYY HH:mm').toISOString();
        }

        if(req.body.availableDate) {
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

        // rewrite german format to ISO
        req.body.availableDate = moment(req.body.availableDate, 'DD.MM.YYYY HH:mm').toISOString();
        req.body.dueDate = moment(req.body.dueDate, 'DD.MM.YYYY HH:mm').toISOString();

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
                data.availableDate = moment(data.availableDate).format('DD.MM.YYYY HH:mm');
                data.dueDate = moment(data.dueDate).format('DD.MM.YYYY HH:mm');
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


const splitDate = function(date){
    const dateF = moment(date).format('DD.MM.YYYY');
    const timeF = moment(date).format('HH:mm');
    return {
        "timestamp":moment(date).valueOf(),
        "date":dateF,
        "time":timeF
    };
}
const formatremaining = function(dueDate){
    let diff = moment.duration(dueDate - Date.now());
    let dueColor, dueString;
    const days = Math.floor(diff.asDays());
    const hours= diff.hours();
    if (days <= 5 && diff.asSeconds() > 0) {
        if (days > 1) {
            dueColor = "days";
        }
        else if (days == 1 || hours> 2) {
            dueColor = "hours";
        }
        else {
            dueColor = "minutes";
        }
        dueString = moment(dueDate).fromNow();
    }
    return {
        "colorClass":dueColor,
        "str":dueString,
        "diff":diff,
        "days":days
    };
}
// Sortierfunktionen
const sortbyavailableDate = function(a, b) {
    const c = new Date(a.availableDate), d = new Date(b.availableDate);
    if (c === d) {return 0;}
    else {return (c < d) ? -1 : 1;}
}
const sortbyDueDate = function(a, b) {
    const c = new Date(a.dueDate), d = new Date(b.dueDate);
    if (c === d) {return 0;}
    else {return (c < d) ? -1 : 1;}
}
const getAverageRating = function(submissions,gradeSystem){
    // Durchschnittsnote berechnen
    if (submissions.length > 0) {
        // Nur bewertete Abgaben einbeziehen 
        let submissiongrades = submissions.filter(function(sub){return (sub.grade!=null);})
        // Abgaben vorhanden?
        if(submissiongrades.length > 0){
            // Noten aus Abgabe auslesen (& in Notensystem umwandeln)
            if (gradeSystem) {
                submissiongrades = submissiongrades.map(function (sub) {
                    return 6 - Math.ceil(sub.grade / 3);
                });
            } else {
                submissiongrades = submissiongrades.map(function (sub) {
                    return sub.grade;
                });
            }
            // Durchschnittsnote berechnen
            let ratingsum = 0;
            submissiongrades.forEach(function (e) {
                ratingsum += e;
            });
            return (ratingsum / submissiongrades.length).toFixed(2);
        }
    }   
    return undefined;
}
router.all('/', function (req, res, next) {
    api(req).get('/homework/', {
        qs: {
            $populate: ['courseId'],
        }
    }).then(assignments => {
        assignments = assignments.data.map(assignment => { // alle Hausaufgaben aus DB auslesen
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

            // Anzeigetext + Farbe für verbleibende Zeit
            const availableDateArray = splitDate(assignment.availableDate);
            const dueDateArray = splitDate(assignment.dueDate);
            const remainingF = formatremaining(dueDateArray["timestamp"]);
            assignment.dueColor = remainingF["colorClass"];
            if(remainingF["days"] > 5 || remainingF["diff"] < 0) {
                assignment.fromdate = availableDateArray["date"] + " (" + availableDateArray["time"] + ")";
                assignment.todate = dueDateArray["date"] + " (" + dueDateArray["time"] + ")";
            }else{
                 assignment.dueString = remainingF["str"];
            }

            // alle Abgaben auslesen -> um Statistiken anzeigen zu können
            const submissionPromise = getSelectOptions(req, 'submissions', {
                homeworkId: assignment._id,
                $populate: ['studentId', 'homeworkId']
            });
            Promise.resolve(submissionPromise).then(submissions => {
                if(assignment.teacherId === res.locals.currentUser._id){  //teacher
                    let submissionLength = submissions.filter(function(n){return n.comment != undefined && n.comment != ""}).length;
                    assignment.submissionStats = submissionLength + "/" + assignment.userIds.length;
                    assignment.submissionStatsPerc = (assignment.userIds.length)?Math.round((submissionLength/assignment.userIds.length)*100):0;
                    let submissionCount = (submissions.filter(function (a) {
                        return (a.gradeComment != '' || a.grade != null);
                    })).length;

                    assignment.gradedStats = submissionCount + "/" + assignment.userIds.length;               // Anzahl der Abgaben
                    assignment.gradedStatsPerc = (assignment.userIds.length)?Math.round((submissionCount/assignment.userIds.length)*100):0; // -||- in Prozent

                    assignment.averageRating = getAverageRating(submissions, assignment.courseId.gradeSystem);

                }else{ //student
                    const submission = submissions.filter(function (n) {return n.studentId._id == res.locals.currentUser._id;})[0];  // Abgabe des Schuelers heraussuchen
                    if (submission != null && submission.comment != ""){ // Abgabe vorhanden?
                        assignment.dueColor = "submitted";
                    }
                }
            });

            assignment.currentUser = res.locals.currentUser;
            assignment.actions = getActions(assignment, '/homework/');
            return assignment;
        });

        // Hausaufgaben sortieren
        let desc = false;
        let sortmethods = getSortmethods();
        if(req.query.sort){
            var sorting = req.query.sort;
            // Aktueller Sortieralgorithmus für Anzeige aufbereiten
            sortmethods = sortmethods.map(function(e){
                if(e.functionname == sorting){
                    e.active = 'selected';
                }else{
                    delete e['active'];
                }
                return e;
            });
            if(sorting == "availableDate"){
                assignments.sort(sortbyavailableDate);
            }else if(sorting == "dueDate"){
                assignments.sort(sortbyDueDate);
            } 
            if(sorting.desc){
                assignments.reverse();
            }
        }

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
                pagination = {
                    currentPage,
                    numPages: Math.ceil(assignments.length / itemsPerPage),
                    baseUrl: '/homework/?p={{page}}'
                };
                const end = currentPage * itemsPerPage;
                assignments = assignments.slice(end - itemsPerPage, end);
                //Render overview
                res.render('homework/overview', {title: 'Meine Aufgaben', pagination, assignments, courses, isStudent, sortmethods, desc});
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
            $populate: ['homeworkId']
        });
        Promise.resolve(submissionPromise).then(submissions => {
            // kein Kurs -> Private Hausaufgabe
            if (assignment.courseId == null) {
                assignment.color = "#1DE9B6";
                assignment.private = true;
            }else {
                // Kursfarbe setzen
                assignment.color = assignment.courseId.color;
            }

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
            if (assignment.teacherId == res.locals.currentUser._id && assignment.courseId != null || assignment.publicSubmissions) {
                // Anzahl der Abgaben -> Statistik in Abgabenübersicht
                assignment.submissionsCount = submissions.filter(function(n){return n.comment != undefined && n.comment != ""}).length;
                assignment.averageRating = getAverageRating(submissions, assignment.courseId.gradeSystem);

                //generate select options for grades @ evaluation.hbs
                const grades = (assignment.courseId.gradeSystem)?["1+","1","1-","2+","2","2-","3+","3","3-","4+","4","4-","5+","5","5-","6"]:["15","14","13","12","11","10","9","8","7","6","5","4","3","2","1","0"];

                let defaultOptions = "";
                for(let i = 15; i >= 0; i--){
                    defaultOptions += ('<option value="'+i+'">'+grades[15-i]+'</option>');
                }
                assignment.gradeOptions = defaultOptions;
                submissions.map(function(sub){
                    let options = "";
                    for(let i = 15; i >= 0; i--){
                        options += ('<option value="'+i+'" '+((sub.grade == i)?"selected ":"")+'>'+grades[15-i]+'</option>');
                    }
                    sub.gradeOptions = options;
                    sub.gradeText = ((assignment.courseId.gradeSystem)?"Note: ":"Punkte: ")+grades[15-sub.grade];
                    return sub;
                })

                // Daten für Abgabenübersicht
                assignment.submissions = submissions;

                // Alle Teilnehmer des Kurses 
                const coursePromise = getSelectOptions(req, 'courses', {
                    _id: assignment.courseId._id,
                    $populate: ['userIds']
                });
                Promise.resolve(coursePromise).then(course => {
                    var students = course[0].userIds;
                    assignment.userCount = students.length;
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
                        // alle Kurse von aktuellem Benutzer auslesen
                        const coursesPromise = getSelectOptions(req, 'courses', {
                            $or: [
                                {userIds: res.locals.currentUser._id},
                                {teacherIds: res.locals.currentUser._id}
                            ]
                        });
                        Promise.resolve(coursesPromise).then(courses => {
                            // -> Kurse stehen nun in courses
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
