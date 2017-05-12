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



const addLeadingZero = function(s) {
    return (s < 10) ? "0" + s : s;
}
const splitDate = function(date){
    var realDate = new Date(new Date(date).getTime() + (new Date(date).getTimezoneOffset() * 60000));
    var DateF = addLeadingZero(realDate.getDate()) + "." + addLeadingZero(realDate.getMonth() + 1) + "." + realDate.getFullYear();
    var TimeF = addLeadingZero(realDate.getHours()) + ":" + addLeadingZero(realDate.getMinutes());
    return {"timestamp":realDate,"date":DateF,"time":TimeF};
}
const formatDateDiff = function(datediff){
    var Days = Math.floor(datediff / 86400000);
    var Hours = Math.floor((datediff % 86400000) / 3600000);
    var Minutes = Math.floor(((datediff % 86400000) % 3600000) / 60000);
    return {"Days":Days,"Hours":Hours,"Minutes":Minutes};
}
const formatremaining = function(remaining){
    var remainingArray = formatDateDiff(remaining);
    var dueColor="", dueString="";
    if (remainingArray["Days"] <= 5 && remaining > 0) {
        if (remainingArray["Days"] > 1) {
            dueColor = "days";
            dueString = "noch " + remainingArray["Days"] + " Tage";
        }
        else if (remainingArray["Days"] == 1) {
            dueColor = "hours";
            dueString = "noch " + remainingArray["Days"] + " Tag " + remainingArray["Hours"] + ((remainingArray["Hours"] == 1) ? " Stunde" : " Stunden");
        }
        else if (remainingArray["Hours"] > 2) {
            dueColor = "hours";
            dueString = "noch " + remainingArray["Hours"] + " Stunden";
        }
        else if (remainingArray["Hours"] >= 1) {
            dueColor = "minutes";
            dueString = "noch " + remainingArray["Hours"] + ((remainingArray["Hours"] == 1) ? " Stunde " : " Stunden ") + remainingArray["Minutes"] + ((remainingArray["Minutes"] == 1) ? " Minute" : " Minuten");
        }
        else {
            dueColor = "minutes";
            dueString = "noch " + remainingArray["Minutes"] + ((remainingArray["Minutes"] == 1) ? " Minute" : " Minuten");
        }
    }
    return {"colorClass":dueColor,"str":dueString};
}
// Sortierfunktionen
const sortbyavailableDate = function(a, b) {
    var c = new Date(a.availableDate), d = new Date(b.availableDate);
    if (c === d) {return 0;}
    else {return (c < d) ? -1 : 1;}
}
const sortbyDueDate = function(a, b) {
    var c = new Date(a.dueDate), d = new Date(b.dueDate);
    if (c === d) {return 0;}
    else {return (c < d) ? -1 : 1;}
}
const getAverageRating = function(submissions,gradeSystem){
    // Durchschnittsnote berechnen
    if (submissions.length > 0) {
        // Nur bewertete Abgaben einbeziehen 
        var submissiongrades = submissions.filter(function(sub){return (sub.grade!=null);})
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
            var ratingsum = 0;
            submissiongrades.forEach(function (e) {
                ratingsum += e;
            });
            var averagerating = (ratingsum / submissiongrades.length).toFixed(2);
        }
    }   
    return averagerating;
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
            var availableDateArray = splitDate(assignment.availableDate);
            var dueDateArray = splitDate(assignment.dueDate);
            var remaining = (dueDateArray["timestamp"] - Date.now());
            var remainingF = formatremaining(remaining);
            assignment.dueColor = remainingF["colorClass"];
            if(remaining > 432000000 /* 5 days */ || remaining < 0) {
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
                    let submissionlength = submissions.filter(function(n){return n.comment != undefined && n.comment != ""}).length;
                    assignment.submissionstats = submissionlength + "/" + assignment.userIds.length;
                    assignment.submissionstatsperc = Math.round((submissionlength/assignment.userIds.length)*100);
                    var submissioncount = (submissions.filter(function (a) {
                        return (a.gradeComment != '' || a.grade != null);
                    })).length;

                    assignment.gradedstats = submissioncount + "/" + assignment.userIds.length;                        // Anzahl der Abgaben
                    assignment.gradedstatsperc = Math.round((submissioncount/assignment.userIds.length)*100);   // -||- in Prozent

                    assignment.submissionscount = submissionlength;
                    assignment.averagerating = getAverageRating(submissions, assignment.courseId.gradeSystem);

                }
                else{ //student
                    var submission = submissions.filter(function (n) {return n.studentId._id == res.locals.currentUser._id;})[0];  // Abgabe des Schuelers heraussuchen
                    if (submission != null && submission.comment != ""){ // Abgabe vorhanden?
                        assignment.dueColor = "submitted";
                    }
                }
            });

            assignment.currentUser = res.locals.currentUser;
            assignment.actions = getActions(assignment, '/homework/');
            return assignment;
        });

        var sortmethods = getSortmethods();
        // Hausaufgaben sortieren
        if(req.query.sort){
            var sorting = JSON.parse(req.query.sort);
            // Aktueller Sortieralgorithmus für Anzeige aufbereiten
            sortmethods = sortmethods.map(function(e){
                if(e.functionname == sorting.fn){
                    e.active = 'selected';
                    e.desc = sorting.desc;
                }else{
                    delete e['active'];
                }
                return e;
            });
            // Hausaufgaben nach gewähltem Algorithmus sortieren
            if(sorting.fn == "availableDate"){
                assignments.sort(sortbyavailableDate);
            }else if(sorting.fn == "dueDate"){
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
                var isStudent = true;
                if (roles.indexOf('student') == -1) {
                    isStudent = false;
                }
                // Render Overview
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
            var availableDateArray = splitDate(assignment.availableDate);
            assignment.availableDateF = availableDateArray["date"];
            assignment.availableTimeF = availableDateArray["time"];

            var dueDateArray = splitDate(assignment.dueDate);
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
                assignment.submissionscount = submissions.filter(function(n){return n.comment != undefined && n.comment != ""}).length;
                assignment.averagerating = getAverageRating(submissions, assignment.courseId.gradeSystem);

                //generate select options for grades @ evaluation.hbs
                submissions.map(function(sub){
                    grades = (assignment.courseId.gradeSystem)?["1+","1","1-","2+","2","2-","3+","3","3-","4+","4","4-","5+","5","5-","6"]:["15","14","13","12","11","10","9","8","7","6","5","4","3","2","1"];
                    options = "";
                    for(var i = 15; i > 0; i--){    
                        options += ('<option value="'+i+'" '+((sub.grade == i)?"selected ":"")+'>'+grades[15-i]+'</option>');
                    }
                    sub.gradeoptions = options;
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
                    assignment.usercount = students.length;
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
                                var isStudent = true;
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
