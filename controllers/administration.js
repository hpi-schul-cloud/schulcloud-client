/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const recurringEventsHelper = require('../helpers/recurringEvents');
const moment = require('moment');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');
const parse = require('csv-parse/lib/sync');
const _ = require('lodash');
moment.locale('de');

const getSelectOptions = (req, service, query, values = []) => {
    return api(req).get('/' + service, {
        qs: query
    }).then(data => {
        return data.data;
    });
};


const getTableActions = (item, path, isAdmin = true, isTeacher = false, isStudentAction = false) => {
    return [
        {
            link: path + item._id,
            class: `btn-edit ${isTeacher ? 'disabled' : ''}`,
            icon: 'edit',
            title: 'Eintrag bearbeiten'
        },
        {
            link: path + item._id,
            class: `${isAdmin ? 'btn-delete' : 'disabled'}`,
            icon: 'trash-o',
            method: `${isAdmin ? 'delete' : ''}`,
            title: 'Eintrag löschen'
        },
        {
            link: isStudentAction ? path + 'pw/' + item._id : '',
            class: isStudentAction ? 'btn-pw' : 'invisible',
            icon: isStudentAction ? 'key' : '',
            title: 'Passwort zurücksetzen'
        }
    ];
};

const getTableActionsSend = (item, path, state) => {
    let actions = [];
    if (state === 'submitted' || state === 'closed') {
        actions.push(
            {
                class: 'disabled',
                icon: 'edit'
            },
            {
                class: 'disabled',
                icon: 'ban'
            },
            {
                class: 'disabled',
                icon: 'paper-plane'
            });
    } else {
        actions.push(
            {
                link: path + item._id,
                class: 'btn-edit',
                icon: 'edit',
                title: 'Eintrag bearbeiten'
            },
            {
                link: path + item._id,
                class: 'btn-disable',
                icon: 'ban',
                method: 'delete',
                title: 'Eintrag löschen'
            },
            {
                link: path + item._id,
                class: 'btn',
                icon: 'paper-plane',
                method: 'post',
                title: 'Eintrag löschen'
            });
    }
    return actions;
};


/**
 * maps the event props from the server to fit the ui components, e.g. date and time
 * @param data {object} - the plain data object
 * @param service {string} - the model or service type
 */
const mapEventProps = (data, service) => {
    if (service === 'courses') {
        // map course times to fit into UI
        (data.times || []).forEach((time, count) => {
            time.duration = time.duration / 1000 / 60;
            time.startTime = moment(time.startTime, "x").format("HH:mm");
            time.count = count;
        });

        // format course start end until date
        if (data.startDate) {
            data.startDate = moment(new Date(data.startDate).getTime()).format("YYYY-MM-DD");
            data.untilDate = moment(new Date(data.untilDate).getTime()).format("YYYY-MM-DD");
        }
    }

    return data;
};

/**
 * sets undefined array-course properties to an empty array
 */
const mapEmptyCourseProps = (req, res, next) => {
    let courseBody = req.body;
    if (!courseBody.classIds) courseBody.classIds = [];
    if (!courseBody.teacherIds) courseBody.teacherIds = [];
    if (!courseBody.userIds) courseBody.userIds = [];
    if (!courseBody.substitutionIds) courseBody.substitutionIds = [];

    next();
};

/**
 * sets undefined array-class properties to an empty array
 */
const mapEmptyClassProps = (req, res, next) => {
    let classBody = req.body;
    if (!classBody.teacherIds) classBody.teacherIds = [];
    if (!classBody.userIds) classBody.userIds = [];
    next();
};

/**
 * maps the request-data to fit model, e.g. for course times
 * @param data {object} - the request-data object
 * @param service {string} - maps
 */
const mapTimeProps = (req, res, next) => {
    // map course times to fit model
    req.body.times = req.body.times || [];
    (req.body.times || []).forEach(time => {
        time.startTime = moment.duration(time.startTime, "HH:mm").asMilliseconds();
        time.duration = time.duration * 60 * 1000;
    });

    next();
};

/**
 * creates an event for a created course. following params has to be included in @param data for creating the event:
 * startDate {Date} - the date the course is first take place
 * untilDate {Date} -  the date the course is last take place
 * duration {Number} - the duration of a course lesson
 * weekday {Number} - from 0 to 6, the weekday the course take place
 * @param data {object}
 * @param service {string}
 */
const createEventsForData = (data, service, req, res) => {
    // can just run if a calendar service is running on the environment and the course have a teacher
    if (process.env.CALENDAR_SERVICE_ENABLED && service === 'courses' && data.teacherIds[0] && data.times.length > 0) {
        return Promise.all(data.times.map(time => {
            return api(req).post("/calendar", {
                json: {
                    summary: data.name,
                    location: res.locals.currentSchoolData.name,
                    description: data.description,
                    startDate: new Date(new Date(data.startDate).getTime() + time.startTime).toISOString(),
                    duration: time.duration,
                    repeat_until: data.untilDate,
                    frequency: "WEEKLY",
                    weekday: recurringEventsHelper.getIsoWeekdayForNumber(time.weekday),
                    scopeId: data._id,
                    courseId: data._id,
                    courseTimeId: time._id
                },
                qs: { userId: data.teacherIds[0] }
            });
        }));
    }

    return Promise.resolve(true);
};

/**
 * Deletes all events from the given dataId in @param req.params, clear function
 * @param service {string}
 */
const deleteEventsForData = (service) => {
    return function (req, res, next) {
        if (process.env.CALENDAR_SERVICE_ENABLED && service === 'courses') {
            return api(req).get('courses/' + req.params.id).then(course => {
                if (course.teacherIds.length < 1 || course.times.length < 1) { // if no teacher, no permission for deleting
                    next();
                    return;
                }
                return Promise.all((course.times || []).map(t => {
                    if (t.eventId) {
                        return api(req).delete('calendar/' + t.eventId, { qs: { userId: course.teacherIds[0] } });
                    }
                })).then(_ => next());
            });
        }

        next();
    };
};

const getCreateHandler = (service) => {
    return function (req, res, next) {
        api(req).post('/' + service + '/', {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            res.locals.createdUser = data;
            (service === 'users') ? sendMailHandler(data, req) : "";
            createEventsForData(data, service, req, res).then(_ => {
                next();
            });
        }).catch(err => {
            next(err);
        });
    };
};

/**
 * send out problem to the sc helpdesk
 * @param service currently only used for helpdesk
 * @returns {Function}
 */
const getSendHelper = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id)
            .then(data => {
                let user = res.locals.currentUser;
                let email = user.email ? user.email : "";
                let innerText = "Problem in Kategorie: " + data.category + "\n";
                let content = {
                    "text": "User: " + user.displayName + "\n"
                        + "E-Mail: " + email + "\n"
                        + "Schule: " + res.locals.currentSchoolData.name + "\n"
                        + innerText
                        + "User schrieb folgendes: \nIst Zustand:\n" + data.currentState + "\n\nSoll-Zustand:\n" + data.targetState + "\n\nAnmerkungen vom Admin:\n" + data.notes
                };
                req.body.email = "ticketsystem@schul-cloud.org";
                req.body.subject = data.subject;
                req.body.content = content;

                api(req).post('/mails', { json: req.body }).then(_ => {
                    api(req).patch('/' + service + '/' + req.params.id, {
                        json: {
                            state: 'submitted',
                            order: 1
                        }
                    });
                    res.sendStatus(200);
                }).catch(err => {
                    res.status((err.statusCode || 500)).send(err);
                });
                res.redirect(req.get('Referrer'));
            });
    };
};

/**
 * Set state to closed of helpdesk problem
 * @param service usually helpdesk, to disable instead of delete entry
 * @returns {Function}
 */
const getDisableHandler = (service) => {
    return function (req, res, next) {
        api(req).patch('/' + service + '/' + req.params.id, {
            json: {
                state: 'closed',
                order: 2
            }
        }).then(_ => {
            res.redirect(req.get('Referrer'));
        });
    };
};

/**
 * Truncates string to 25 chars
 * @param string given string to truncate
 * @returns {string}
 */
const truncate = (string) => {
    if ((string || {}).length > 25) {
        return string.substring(0, 25) + '...';
    } else {
        return string;
    }
};

const getCSVImportHandler = (service) => {
    return function (req, res, next) {
        let csvData = '';
        let records = [];

        try {
            csvData = decoder.write(req.file.buffer);
            records = parse(csvData, { columns: true, delimiter: ',' });
        } catch (err) {
            req.session.notification = {
                type: 'danger',
                message: 'Import fehlgeschlagen.'
            };
        }

        const groupData = {
            schoolId: req.body.schoolId,
            roles: req.body.roles
        };

        const recordPromises = records.map((user) => {
            user = Object.assign(user, groupData);
            return api(req).post('/' + service + '/', {
                json: user
            })
                .then(newUser => {
                    sendMailHandler(newUser, req);
                });
        });

        Promise.all(recordPromises).then(_ => {
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};

const dictionary = {
    open: 'Offen',
    closed: "Geschlossen",
    submitted: 'Gesendet',
    dashboard: 'Übersicht',
    courses: 'Kurse',
    classes: 'Klassen',
    homework: 'Aufgaben',
    files: 'Dateien',
    content: 'Materialien',
    administration: 'Verwaltung',
    login_registration: 'Anmeldung/Registrierung',
    other: 'Sonstiges',
    technical_problems: 'Techn. Probleme'
};

const getUpdateHandler = (service) => {
    return function (req, res, next) {
        api(req).patch('/' + service + '/' + req.params.id, {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            createEventsForData(data, service, req, res).then(_ => {
                res.redirect(req.header('Referer'));
            });
        }).catch(err => {
            next(err);
        });
    };
};


const getDetailHandler = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id).then(data => {
            res.json(mapEventProps(data, service));
        }).catch(err => {
            next(err);
        });
    };
};


const getDeleteHandler = (service) => {
    return function (req, res, next) {
        api(req).delete('/' + service + '/' + req.params.id).then(_ => {
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};

const getDeleteAccountForUserHandler = (req, res, next) => {
    api(req).get("/accounts/", {
        qs: {
            userId: req.params.id
        }
    }).then(accounts => {
        // if no account find, user isn't fully registered
        if (!accounts || accounts.length <= 0) {
            next();
            return;
        }

        // for now there is only one account for a given user
        let account = accounts[0];
        api(req).delete("/accounts/" + account._id).then(_ => {
            next();
        });
    }).catch(err => {
        next(err);
    });
};

const removeSystemFromSchoolHandler = (req, res, next) => {
    api(req).patch('/schools/' + res.locals.currentSchool, {
        json: {
            $pull: {
                systems: req.params.id
            }
        }
    }).then(_ => {
        next();
    }).catch(err => {
        next(err);
    });
};

const createSystemHandler = (req, res, next) => {
    api(req).post('/systems/', { json: req.body }).then(system => {
        api(req).patch('/schools/' + req.body.schoolId, {
            json: {
                $push: {
                    systems: system._id
                }
            }
        }).then(data => {
            next();
        }).catch(err => {
            next(err);
        });
    });
};

const getStorageProviders = () => {
    return [
        { label: 'AWS S3', value: 'awsS3' }
    ];
};

const getSSOTypes = () => {
    return [
        { label: 'Moodle', value: 'moodle' },
        { label: 'itslearning', value: 'itslearning' },
        { label: 'IServ', value: 'iserv' }
    ];
};

const createBucket = (req, res, next) => {
    if (req.body.fileStorageType) {
        Promise.all([
            api(req).post('/fileStorage', {
                json: { fileStorageType: req.body.fileStorageType, schoolId: req.params.id }
            }),
            api(req).patch('/schools/' + req.params.id, {
                json: req.body
            })]).then(data => {
                res.redirect(req.header('Referer'));
            }).catch(err => {
                next(err);
            });
    }
};

const sendMailHandler = (user, req) => {
    let createdUser = user;
    let email = createdUser.email;
    fs.readFile(path.join(__dirname, '../views/template/registration.hbs'), (err, data) => {
        if (!err) {
            let source = data.toString();
            let template = handlebars.compile(source);
            let outputString = template({
                "url": (req.headers.origin || process.env.HOST) + "/register/account/" + createdUser._id,
                "firstName": createdUser.firstName,
                "lastName": createdUser.lastName
            });

            let content = {
                "html": outputString,
                "text": "Sehr geehrte/r " + createdUser.firstName + " " + createdUser.lastName + ",\n\n" +
                    "Sie wurden in die Schul-Cloud eingeladen, bitte registrieren Sie sich unter folgendem Link:\n" +
                    (req.headers.origin || process.env.HOST) + "/register/account/" + createdUser._id + "\n\n" +
                    "Mit Freundlichen Grüßen" + "\nIhr Schul-Cloud Team"
            };
            req.body.content = content;
            api(req).post('/mails', {
                json: {
                    headers: {},
                    email: email,
                    subject: "Einladung in die Schul-Cloud",
                    content: content
                }
            }).then(_ => {
                return true;
            });
        }
    });
};

const returnAdminPrefix = (roles) => {
    let prefix;
    roles.map(role => {
        (role.name === "teacher") ? prefix = 'Verwaltung: ' : prefix = "Administration: ";
    });
    return prefix;
};

const getClasses = (user, classes, teacher) => {
    let userClasses = '';

    if (teacher) {
        classes.data.map(uClass => {
            if (uClass.teacherIds.includes(user._id)) {
                if (userClasses !== '') {
                    userClasses = userClasses + ' , ' + uClass.name;
                } else {
                    userClasses = uClass.name;
                }
            }
        });
    } else {
        classes.data.map(uClass => {
            if (uClass.userIds.includes(user._id)) {
                if (userClasses !== '') {
                    userClasses = userClasses + ' , ' + uClass.name;
                } else {
                    userClasses = uClass.name;
                }
            }
        });
    }

    return userClasses;
};

// with userId to accountId
const userIdtoAccountIdUpdate = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/?userId=' + req.params.id)
            .then(users => {
                api(req).patch('/' + service + '/' + users[0]._id, {
                    // TODO: sanitize
                    json: req.body
                }).then(data => {
                    res.redirect(req.header('Referer'));
                }).catch(err => {
                    next(err);
                });
            })
            .catch(err => {
                next(err);
            });
    };
};

const userFilterSettings = function (defaultOrder) {
    return [
        {
            type: "sort",
            title: 'Sortierung',
            displayTemplate: 'Sortieren nach: %1',
            options: [
                ["firstName", "Vorname"],
                ["lastName", "Nachname"],
                ["email", "E-Mail-Adresse"]
            ],
            defaultSelection: (defaultOrder? defaultOrder : "firstName"),
            defaultOrder: "DESC"
        },
        {
            type: "limit",
            title: 'Einträge pro Seite',
            displayTemplate: 'Einträge pro Seite: %1',
            options: [10, 25, 50, 100],
            defaultSelection: 25
        },
        {
            type: "select",
            title: 'Geschlecht',
            displayTemplate: 'Geschlecht: %1',
            property: 'gender',
            multiple: true,
            expanded: true,
            options: [
                ["male", "Männlich"],
                ["female", "Weiblich"],
                ["other", "Anderes"],
                [null, "nicht Angegeben"]
            ]
        },
    ];
};

// secure routes
router.use(authHelper.authChecker);

// teacher admin permissions
router.all('/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), function (req, res, next) {
    let title = returnAdminPrefix(res.locals.currentUser.roles);

    api(req).get('/schools/' + res.locals.currentSchool).then(data => {
        let provider = getStorageProviders();
        provider = (provider || []).map(prov => {
            if (prov.value == data.fileStorageType) {
                return Object.assign(prov, {
                    selected: true
                });
            } else {
                return prov;
            }
        });

        let ssoTypes = getSSOTypes();

        api(req).get('/fileStorage/total').then(totalStorage => {
            res.render('administration/school', { title: title + 'Allgemein', school: data, provider, ssoTypes, totalStorage: totalStorage });
        });
    });
});
router.post('/teachers/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), getCreateHandler('users'));
router.patch('/teachers/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), getUpdateHandler('users'));
router.get('/teachers/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), getDetailHandler('users'));
router.delete('/teachers/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), getDeleteAccountForUserHandler, getDeleteHandler('users'));
router.post('/teachers/import/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), upload.single('csvFile'), getCSVImportHandler('users'));

router.all('/teachers', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), function (req, res, next) {

    const tempOrgQuery = (req.query||{}).filterQuery;
    const filterQueryString = (tempOrgQuery)?('&filterQuery='+ escape(tempOrgQuery)):'';

    let itemsPerPage = 25;
    let filterQuery = {};
    if (tempOrgQuery) {
        filterQuery = JSON.parse(unescape(req.query.filterQuery));
        if (filterQuery["$limit"]) {
            itemsPerPage = filterQuery["$limit"];
        }
    }

    const currentPage = parseInt(req.query.p) || 1;
    let title = returnAdminPrefix(res.locals.currentUser.roles);

    let query = {
        roles: ['teacher'],
        $populate: ['roles'],
        $limit: itemsPerPage,
        $skip: itemsPerPage * (currentPage - 1),
    };
    query = Object.assign(query, filterQuery);

    api(req).get('/users', {
        qs: query
    }).then(data => {
        api(req).get('/classes').then(classes => {
            const head = [
                'Vorname',
                'Nachname',
                'E-Mail-Adresse',
                'Klasse(n)',
                ''
            ];

            const body = data.data.map(item => {
                return [
                    item.firstName,
                    item.lastName,
                    item.email,
                    getClasses(item, classes, true),
                    getTableActions(
                        item,
                        '/administration/teachers/',
                        _.includes(res.locals.currentUser.permissions, 'ADMIN_VIEW'),
                        _.includes(res.locals.currentUser.permissions, 'TEACHER_CREATE'))
                ];
            });

            const pagination = {
                currentPage,
                numPages: Math.ceil(data.total / itemsPerPage),
                baseUrl: '/administration/teachers/?p={{page}}' + filterQueryString
            };

            res.render('administration/teachers', {
                title: title + 'Lehrer',
                head, body, pagination,
                filterSettings: JSON.stringify(userFilterSettings('lastName'))
            });
        });
    });
});

const getStudentUpdateHandler = () => {
    return function (req, res, next) {
        const birthday = req.body.birthday.split('.');
        req.body.birthday = `${birthday[2]}-${birthday[1]}-${birthday[0]}T00:00:00Z`
        // extractConsent
        /*let parentConsent = {
            _id: req.body.parent_consentId,
            userConsent: {
                form: req.body.parent_form,
                privacyConsent: req.body.parent_privacyConsent || false,
                researchConsent: req.body.parent_researchConsent || false,
                thirdPartyConsent: req.body.parent_thirdPartyConsent || false,
                termsOfUseConsent: req.body.parent_termsOfUseConsent || false
            }
        };*/
        let studentConsent = {
            _id: req.body.student_consentId,
            userConsent: {
                form: req.body.student_form,
                privacyConsent: req.body.student_privacyConsent || false,
                researchConsent: req.body.student_researchConsent || false,
                thirdPartyConsent: req.body.student_thirdPartyConsent || false,
                termsOfUseConsent: req.body.student_termsOfUseConsent || false
            }
        };
        // remove all consent infos from user post
        Object.keys(req.body).forEach(function(key) {
            if(key.startsWith("parent_") || key.startsWith("student_")){
                delete req.body[key];
            }
        });
        // TODO send to server
        const userUpdatePromise = api(req).patch('/users/' + req.params.id, { json: req.body }); // TODO: sanitize
        const studentConsentUpdatePromise = api(req).patch('/consents/' + studentConsent._id, { json: studentConsent });
        //const parentConsentUpdatePromise = api(req).patch('/consents/' + parentConsent._id, { json: parentConsent });
        Promise.all([
            userUpdatePromise,
            studentConsentUpdatePromise,
            //parentConsentUpdatePromise
        ]).then(([user, studentConsent, parentConsent]) => {
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};

router.post('/students/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), getCreateHandler('users'));
router.post('/students/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), getStudentUpdateHandler());
router.patch('/students/pw/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), userIdtoAccountIdUpdate('accounts'));
router.get('/students/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), getDetailHandler('users'));
router.post('/students/import/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), upload.single('csvFile'), getCSVImportHandler('users'));
router.delete('/students/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), getDeleteAccountForUserHandler, getDeleteHandler('users'));

router.all('/students', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), function (req, res, next) {

    const tempOrgQuery = (req.query||{}).filterQuery;
    const filterQueryString = (tempOrgQuery)?('&filterQuery='+ escape(tempOrgQuery)):'';

    let itemsPerPage = 25;
    let filterQuery = {};
    if (tempOrgQuery) {
        filterQuery = JSON.parse(unescape(req.query.filterQuery));
        if (filterQuery["$limit"]) {
            itemsPerPage = filterQuery["$limit"];
        }
    }

    const currentPage = parseInt(req.query.p) || 1;
    let title = returnAdminPrefix(res.locals.currentUser.roles);

    let query = {
        roles: ['student'],
        $populate: ['roles'],
        $limit: itemsPerPage,
        $skip: itemsPerPage * (currentPage - 1),
    };
    query = Object.assign(query, filterQuery);

    api(req).get('/users', {
        qs: query
    }).then(userData => {
        let users = userData.data;

        const classesPromise = getSelectOptions(req, 'classes', {});
        const consentsPromise = getSelectOptions(req, 'consents', {userId: {
            $in: users.map((user) => {
                return user._id;
            })
          }});

        Promise.all([
            classesPromise,
            consentsPromise
        ]).then(([classes, consents]) => {
            users = users.map((user) => {
                // add consentStatus to user
                const consent = consents.find((consent) => {
                    return consent.userId == user._id;
                });
                if(consent){
                    if(consent.requiresParentConsent){
                        if(consent.parentConsents.length == 0){
                            user.consentStatus = `<i class="fa fa-times"></i>`
                        }else{
                            if(consent.userConsent.privacyConsent && consent.userConsent.thirdPartyConsent && consent.userConsent.termsOfUseConsent && consent.userConsent.researchConsent){
                                user.consentStatus = `<i class="fa fa-check"></i>`;
                            }else{
                                user.consentStatus = `<i class="fa fa-adjust"></i>`;
                            }
                        }
                    }else{
                        if(consent.userConsent && consent.userConsent.privacyConsent && consent.userConsent.thirdPartyConsent && consent.userConsent.termsOfUseConsent && consent.userConsent.researchConsent){
                            user.consentStatus = `<i class="fa fa-check"></i>`;
                        }else{
                            user.consentStatus = `<i class="fa fa-circle"></i>`;
                        }
                    }
                }else{
                    user.consentStatus = `<i class="fa fa-times"></i>`
                }
                user.consentStatus = `<p class="text-center m-0">${user.consentStatus}</p>`
                // add classes to user
                user.classesString = classes.filter((currentClass) => {
                    return currentClass.userIds.includes(user._id);
                }).map((currentClass) => {return currentClass.name;}).join(', ');
                return user;
            })

            const head = [
                'Vorname',
                'Nachname',
                'E-Mail-Adresse',
                'Klasse(n)',
                'Einwilligung',
                ''
            ];

            const body = users.map(user => {
                return [
                    user.firstName,
                    user.lastName,
                    user.email,
                    user.classesString,
                    user.consentStatus,
                    `<a class="btn btn-sm" href="/administration/students/${user._id}/edit" title="Nutzer bearbeiten"><i class="fa fa-edit"></i></a>`
                ];
            });

            const pagination = {
                currentPage,
                numPages: Math.ceil(userData.total / itemsPerPage),
                baseUrl: '/administration/students/?p={{page}}' + filterQueryString
            };

            res.render('administration/students', {
                title: title + 'Schüler',
                head, body, pagination,
                filterSettings: JSON.stringify(userFilterSettings())
            });
        });
    });
});


/*
return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id).then(data => {
 */

router.get('/students/:id/edit', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), function (req, res, next) {
    const userPromise = api(req).get('/users/' + req.params.id);
    const consentPromise = getSelectOptions(req, 'consents', {userId: req.params.id, $populate:['parentConsents']});

    Promise.all([
        userPromise,
        consentPromise
    ]).then(([user, consent]) => {
        consent = consent[0];
        consent.parentConsent = (consent.parentConsents.length)?consent.parentConsents[0]:{};
        if(consent.parentConsents.length){
            consent.requiresParentConsent = true;
        }
        res.render('administration/students_edit',
            {
                title: 'Schüler bearbeiten',
                submitLabel : 'Speichern',
                closeLabel : 'Abbrechen',
                student: user,
                consent
            }
        );
    });
});


router.patch('/helpdesk/:id', permissionsHelper.permissionsChecker('HELPDESK_VIEW'), getUpdateHandler('helpdesk'));
router.get('/helpdesk/:id', permissionsHelper.permissionsChecker('HELPDESK_VIEW'), getDetailHandler('helpdesk'));
router.delete('/helpdesk/:id', permissionsHelper.permissionsChecker('HELPDESK_VIEW'), getDisableHandler('helpdesk'));
router.post('/helpdesk/:id', permissionsHelper.permissionsChecker("HELPDESK_VIEW"), getSendHelper('helpdesk'));
router.all('/helpdesk', permissionsHelper.permissionsChecker('HELPDESK_VIEW'), function (req, res, next) {

    const itemsPerPage = (req.query.limit || 10);
    const currentPage = parseInt(req.query.p) || 1;
    let title = returnAdminPrefix(res.locals.currentUser.roles);

    api(req).get('/helpdesk', {
        qs: {
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1),
            $sort: req.query.sort
        }
    }).then(data => {
        const head = [
            'Titel',
            'Ist-Zustand',
            'Soll-Zustand',
            'Kategorie',
            'Status',
            'Anmerkungen',
            ''
        ];

        const body = data.data.map(item => {
            return [
                truncate(item.subject),
                truncate(item.currentState),
                truncate(item.targetState),
                dictionary[item.category],
                dictionary[item.state],
                truncate(item.notes),
                getTableActionsSend(item, '/administration/helpdesk/', item.state)
            ];
        });

        let sortQuery = '';
        if (req.query.sort) {
            sortQuery = '&sort=' + req.query.sort;
        }

        let limitQuery = '';
        if (req.query.limit) {
            limitQuery = '&limit=' + req.query.limit;
        }

        const pagination = {
            currentPage,
            numPages: Math.ceil(data.total / itemsPerPage),
            baseUrl: '/administration/helpdesk/?p={{page}}' + sortQuery + limitQuery
        };

        res.render('administration/helpdesk', { title: title + 'Helpdesk', head, body, pagination, limit: true});
    });
});


router.patch('/classes/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), mapEmptyClassProps, getUpdateHandler('classes'));
router.delete('/classes/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), getDeleteHandler('classes'));

const renderClassEdit = (req, res, next, edit) => {
    api(req).get('/classes/')
    .then(classes => {
        let promises = [
            getSelectOptions(req, 'users', {roles: ['teacher', 'demoTeacher'], $limit: 1000}), //teachers
            getSelectOptions(req, 'years'),
            getSelectOptions(req, 'gradeLevels')
        ];
        if(edit){promises.push(api(req).get(`/classes/${req.params.classId}`));}

        Promise.all(promises).then(([teachers, schoolyears, gradeLevels, currentClass]) => {
            const isAdmin = res.locals.currentUser.permissions.includes("ADMIN_VIEW");
            if(isAdmin){
                // preselect current teacher when creating new class and the current user isn't a admin (teacher)
                teachers.forEach(t => {
                    if (JSON.stringify(t._id) === JSON.stringify(res.locals.currentUser._id)){
                        t.selected = true;
                    }
                });
            }
            let isCustom = false;
            if(currentClass){
                // preselect already selected teachers
                teachers.forEach(t => {
                    if(currentClass.teacherIds.includes(t._id)){t.selected = true;}
                });
                gradeLevels.forEach(g => {
                    if(currentClass.gradeLevel == g._id) {g.selected = true;}
                });
                schoolyears.forEach(schoolyear => {
                    if(currentClass.year == schoolyear._id) {schoolyear.selected = true;}
                });
                if (currentClass.nameFormat == "static") {
                    isCustom = true;
                    currentClass.customName = currentClass.name;
                    if (currentClass.year) {
                        currentClass.keepYear = true;
                    }
                } else if (currentClass.nameFormat == "gradeLevel+name") {
                    currentClass.classsuffix = currentClass.name;
                }              
            }
            res.render('administration/classes-edit', {
                title: `Klasse ${edit?`'${currentClass.displayName}' bearbeiten`:"erstellen"}`,
                edit,
                schoolyears,
                teachers,
                class: currentClass,
                gradeLevels,
                isCustom
            });
        });
    });
};
router.get('/classes/create', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_CREATE'], 'or'), function (req, res, next) {
    renderClassEdit(req,res,next,false);
});
router.get('/classes/:classId/edit', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {
    renderClassEdit(req,res,next,true);
});

router.get('/classes/:classId/manage', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {
    api(req).get('/classes/' + req.params.classId, { qs: { $populate: ['teacherIds', 'substitutionIds', 'userIds']}})
    .then(currentClass => {
        const classesPromise = getSelectOptions(req, 'classes', {$limit: 1000}); // TODO limit classes to scope (year before, current and without class)
        const teachersPromise = getSelectOptions(req, 'users', {roles: ['teacher', 'demoTeacher'], $limit:  1000});
        const studentsPromise = getSelectOptions(req, 'users', {roles: ['student', 'demoStudent'], $limit: 10000});

        Promise.all([
            classesPromise,
            teachersPromise,
            studentsPromise
        ]).then(([classes, teachers, students]) => {
            const isAdmin = res.locals.currentUser.permissions.includes("ADMIN_VIEW");
            if(isAdmin){
                // preselect current teacher when creating new class and the current user isn't a admin (teacher)
                teachers.forEach(t => {
                    if (JSON.stringify(t._id) === JSON.stringify(res.locals.currentUser._id)){
                        t.selected = true;
                    }
                });
            }
            // preselect current teacher when creating new class
 
            const teacherIds = currentClass.teacherIds.map(t => {return t._id;});
            teachers.forEach(t => {
                if(teacherIds.includes(t._id)){
                    t.selected = true;
                }
            });
            const studentIds = currentClass.userIds.map(t => {return t._id;});
            students.forEach(s => {
                if (studentIds.includes(s._id)) {
                    s.selected = true;
                }
            })
            res.render('administration/classes-manage', {
                title: `Klasse '${currentClass.name}' verwalten `,
                "class": currentClass,
                classes,
                teachers,
                students,
                notes: [
                    {
                        "title":"Deine Schüler sind unter 18 Jahre alt?",
                        "content":"Gib den Registrierungslink zunächst an die Eltern weiter. Diese legen die Schülerdaten an und erklären elektronisch ihr Einverständnis. Der Schüler ist dann in der Schul-Cloud registriert und du siehst ihn in deiner Klassenliste. Der Schüler kann sich mit seiner E-Mail-Adresse und dem individuellen Initial-Passwort einloggen. Nach dem ersten Login muss jeder Schüler sein Passwort ändern. Ist der Schüler über 14 Jahre alt, muss er zusätzlich selbst elektronisch sein Einverständnis erklären, damit er die Schul-Cloud nutzen kann."
                    },
                    {
                        "title":"Deine Schüler sind mindestens 18 Jahre alt?",
                        "content":"Gib den Registrierungslink direkt an den Schüler weiter. Die Schritte für die Eltern entfallen automatisch."
                    },
                    /*{ // TODO - Feature not implemented
                        "title":"Deine Schüler sind in der Schülerliste rot?",
                        "content":"Sie sind vom Administrator bereits angelegt (z.B. durch Import aus Schüler-Verwaltungs-Software), aber es fehlen noch ihre Einverständniserklärungen. Lade die Schüler deiner Klasse und deren Eltern ein, ihr Einverständnis zur Nutzung der Schul-Cloud elektronisch abzugeben. Bereits erfasste Schülerdaten werden beim Registrierungsprozess automatisch gefunden und ergänzt."
                    },
                    { // TODO - Not implemented yet
                        "title":"Nutzernamen herausfinden",
                        "content":"Lorem Amet ad in officia fugiat nisi anim magna tempor laborum in sit esse nostrud consequat."
                    }, */
                    {
                        "title":"Passwort ändern",
                        "content":"Beim ersten Login muss der Schüler sein Passwort ändern. Hat er eine E-Mail-Adresse angegeben, kann er sich das geänderte Passwort zusenden lassen oder sich bei Verlust ein neues Passwort generieren. Alternativ kannst du im Bereich Verwaltung > Schüler hinter dem Schülernamen auf Bearbeiten klicken. Dann kann der Schüler an deinem Gerät sein Passwort neu eingeben."
                    },
                ]
            });
        });
    });
});

router.post('/classes/:classId/manage', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {
    let changedClass = {
        teacherIds: req.body.teacherIds || [],
        userIds: req.body.userIds || []
    }
    api(req).patch('/classes/' + req.params.classId, {
        // TODO: sanitize
        json: changedClass
    }).then(data => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
})

router.get('/classes/students', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {
    const classIds = JSON.parse(req.query.classes);
    api(req).get('/classes/', { qs: { 
        $populate: ['userIds'],
        _id: {
            $in: classIds
        }
    }})
    .then(classes => {
        const students = classes.data.map((c) => {
            return c.userIds;
        }).reduce((flat, next) => {return flat.concat(next);}, []);
        res.json(students);
    });
});

router.post('/classes/create', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_CREATE'], 'or'), function (req, res, next) {
    let newClass = {
        schoolId: req.body.schoolId
    }
    if (req.body.classcustom) {
        newClass.name = req.body.classcustom;
        newClass.nameFormat = "static";
        if (req.body.keepyear) {
            newClass.year = req.body.schoolyear;
        }
    } else if (req.body.classsuffix) {
        newClass.name = req.body.classsuffix;
        newClass.gradeLevel = req.body.grade;
        newClass.nameFormat = "gradeLevel+name";
        newClass.year = req.body.schoolyear;
    }
    if (req.body.teacherIds) {
        newClass.teacherIds = req.body.teacherIds;
    }
    
    api(req).post('/classes/', {
        // TODO: sanitize
        json: newClass
    }).then(data => {
        const isAdmin = res.locals.currentUser.permissions.includes("ADMIN_VIEW");
        if(isAdmin){
            res.redirect(`/administration/classes/`);
        }else{
            res.redirect(`/administration/classes/${data._id}/manage`);
        }
    }).catch(err => {
        next(err);
    });
});

router.post('/classes/:classId/edit', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {
    let changedClass = {
        schoolId: req.body.schoolId
    }
    if (req.body.classcustom) {
        changedClass.name = req.body.classcustom;
        changedClass.nameFormat = "static";
        if (req.body.keepyear) {
            changedClass.year = req.body.schoolyear;
        }
    } else if (req.body.classsuffix) {
        changedClass.name = req.body.classsuffix;
        changedClass.gradeLevel = req.body.grade;
        changedClass.nameFormat = "gradeLevel+name";
        changedClass.year = req.body.schoolyear;
    }
    if (req.body.teacherIds) {
        changedClass.teacherIds = req.body.teacherIds;
    }
    api(req).patch('/classes/' + req.params.classId, {
        // TODO: sanitize
        json: changedClass
    }).then(data => {
        const isAdmin = res.locals.currentUser.permissions.includes("ADMIN_VIEW");
        if(isAdmin){
            res.redirect(`/administration/classes/`);
        }else{
            res.redirect(`/administration/classes/`);
        }
    }).catch(err => {
        next(err);
    });
});

router.patch('/:classId/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), mapEmptyClassProps, function (req, res, next) {
    api(req).patch('/classes/' + req.params.classId, {
        // TODO: sanitize
        json: req.body
    }).then(data => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
});

router.delete('/:classId/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {
    api(req).delete('/classes/' + req.params.classId).then(_ => {
        res.sendStatus(200);
    }).catch(_ => {
        res.sendStatus(500);
    });
});

router.all('/classes', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {

    const itemsPerPage = (req.query.limit || 10);
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/classes', {
        qs: {
            $populate: ['teacherIds'],
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1),
            $sort: req.query.sort
        }
    }).then(data => {
        const head = [
            'Name',
            'Lehrer',
            ''
        ];

        let teachersPromise = getSelectOptions(req, 'users', { roles: ['teacher'], $limit: 1000 });
        let studentsPromise = getSelectOptions(req, 'users', { roles: ['student'], $limit: 1000 });

        Promise.all([
            teachersPromise,
            studentsPromise
        ]).then(([teachers, students]) => {
            const body = data.data.map(item => {
                return [
                    item.name,
                    (item.teacherIds || []).map(item => item.lastName).join(', '),
                    ((item, path)=>{return [
                        {
                            link: path + item._id + "/manage",
                            class: `btn-manage`,
                            icon: 'users',
                            title: 'Klasse verwalten'
                        },
                        {
                            link: path + item._id + "/edit",
                            class: `btn-edit`,
                            icon: 'pencil',
                            title: 'Klasse bearbeiten'
                        },
                        {
                            link: path + item._id,
                            class: `btn-delete`,
                            icon: 'trash-o',
                            method: `delete`,
                            title: 'Eintrag löschen'
                        }
                    ];})(item, '/administration/classes/')
                ];
            });

            let sortQuery = '';
            if (req.query.sort) {
                sortQuery = '&sort=' + req.query.sort;
            }

            let limitQuery = '';
            if (req.query.limit) {
                limitQuery = '&limit=' + req.query.limit;
            }

            const pagination = {
                currentPage,
                numPages: Math.ceil(data.total / itemsPerPage),
                baseUrl: '/administration/classes/?p={{page}}' + sortQuery + limitQuery
            };

            res.render('administration/classes', {
                title: 'Administration: Klassen',
                head,
                body,
                teachers,
                students,
                pagination,
                limit: true
            });
        });
    });
});


// general admin permissions
// ONLY useable with ADMIN_VIEW !
router.use(permissionsHelper.permissionsChecker('ADMIN_VIEW'));
router.patch('/schools/:id', getUpdateHandler('schools'));
router.post('/schools/:id/bucket', createBucket);
router.post('/courses/', mapTimeProps, getCreateHandler('courses'));
router.patch('/courses/:id', mapTimeProps, mapEmptyCourseProps, deleteEventsForData('courses'), getUpdateHandler('courses'));
router.get('/courses/:id', getDetailHandler('courses'));
router.delete('/courses/:id', getDeleteHandler('courses'), deleteEventsForData('courses'));

router.all('/courses', function (req, res, next) {

    const itemsPerPage = (req.query.limit || 10);
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/courses', {
        qs: {
            $populate: ['classIds', 'teacherIds'],
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1),
            $sort: req.query.sort
        }
    }).then(data => {
        const head = [
            'Name',
            'Klasse(n)',
            'Lehrer',
            ''
        ];

        const classesPromise = getSelectOptions(req, 'classes', { $limit: 1000 });
        const teachersPromise = getSelectOptions(req, 'users', { roles: ['teacher'], $limit: 1000 });
        const substitutionPromise = getSelectOptions(req, 'users', { roles: ['teacher'], $limit: 1000 });
        const studentsPromise = getSelectOptions(req, 'users', { roles: ['student'], $limit: 1000 });

        Promise.all([
            classesPromise,
            teachersPromise,
            substitutionPromise,
            studentsPromise
        ]).then(([classes, teachers, substitutions, students]) => {
            const body = data.data.map(item => {
                return [
                    item.name,
                    (item.classIds || []).map(item => item.name).join(', '),
                    (item.teacherIds || []).map(item => item.lastName).join(', '),
                    getTableActions(item, '/administration/courses/').map(action => {
                        
                        return action;
                    })
                ];
            });

            let sortQuery = '';
            if (req.query.sort) {
                sortQuery = '&sort=' + req.query.sort;
            }

            let limitQuery = '';
            if (req.query.limit) {
                limitQuery = '&limit=' + req.query.limit;
            }

            const pagination = {
                currentPage,
                numPages: Math.ceil(data.total / itemsPerPage),
                baseUrl: '/administration/courses/?p={{page}}' + sortQuery + limitQuery
            };

            res.render('administration/courses', {
                title: 'Administration: Kurse',
                head,
                body,
                classes,
                teachers,
                substitutions,
                students,
                pagination,
                limit: true
            });
        });
    });
});


router.post('/systems/', createSystemHandler);
router.patch('/systems/:id', getUpdateHandler('systems'));
router.get('/systems/:id', getDetailHandler('systems'));
router.delete('/systems/:id', removeSystemFromSchoolHandler, getDeleteHandler('systems'));

router.all('/systems', function (req, res, next) {

    api(req).get('/schools/' + res.locals.currentSchool, {
        qs: {
            $populate: ['systems'],
            $sort: req.query.sort
        }
    }).then(data => {
        const head = [
            'Alias',
            'Typ',
            'Url',
            ''
        ];

        let body;
        let systems;
        if (data.systems) {
            data.systems = _.orderBy(data.systems, req.query.sort, 'desc');
            systems = data.systems.filter(system => system.type != 'local');

            body = systems.map(item => {
                let name = getSSOTypes().filter(type => item.type === type.value);
                return [
                    item.alias,
                    name,
                    item.url,
                    getTableActions(item, '/administration/systems/')
                ];
            });

        }

        const availableSSOTypes = getSSOTypes();

        res.render('administration/systems', {
            title: 'Administration: Authentifizierungsdienste',
            head,
            body,
            systems,
            availableSSOTypes
        });
    });
});

/**
 * Dataprivcay routes
 */
router.get('/dataprivacy/student', function (req, res, next) {
    res.render('administration/dataprivacy/student', {
        title: 'Datenerfassung: Einverständniserklärung'
    });
});
router.get('/dataprivacy/teacher', function (req, res, next) {
    res.render('administration/dataprivacy/teacher', {
        title: 'Datenerfassung: Einverständniserklärung'
    });
});

module.exports = router;
