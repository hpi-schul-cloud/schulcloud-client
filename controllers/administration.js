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

const cutEditOffUrl = (url) => {    //nicht optimal, aber req.header('Referer') gibt auf einer edit Seite die edit Seite, deshalb diese URL Manipulation
    let workingURL = url;
    if(url.endsWith("/edit")){
        workingURL = workingURL.replace("/edit", "");
        workingURL = workingURL.substring(0, workingURL.lastIndexOf("/"));
    }
    return workingURL;
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
                icon: 'archive'
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
                icon: 'archive',
                method: 'delete',
                title: 'Eintrag abschließen'
            },
            {
                link: path + item._id,
                class: 'btn',
                icon: 'paper-plane',
                method: 'post',
                title: 'Eintrag an Entwicklerteam senden'
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

/**
 * Generates short registration link, optionally with user hash. email and sendMail will be gathered from req.body of not set.
 * @param params {
 *          role: user role = string "teacher"/"student"
 *          save: hash will be generated with URI-safe characters
 *          patchUser: hash will be patched into the user (DB)
 *          host: current webaddress from client = string, looks for req.headers.origin first
 *          schoolId: users schoolId = string
 *          toHash: optional, user account mail for hash generation = string
 *      }
 */
const generateRegistrationLink = (params, internalReturn) => {
    return function (req, res, next) {
        let options = JSON.parse(JSON.stringify(params));
        if (!options.role) options.role = req.body.role || "";
        if (!options.save) options.save = req.body.save || "";
        if (!options.patchUser) options.patchUser = req.body.patchUser || "";
        if (!options.host) options.host = req.headers.origin || req.body.host || "";
        if (!options.schoolId) options.schoolId = req.body.schoolId || "";
        if (!options.toHash) options.toHash = req.body.email || req.body.toHash || "";
        
        if(internalReturn){
            return api(req).post("/registrationlink/", {
                json: options
            });
        } else {
            return api(req).post("/registrationlink/", {
                json: options
            }).then(linkData => {
                res.locals.linkData = linkData;
                if(options.patchUser) req.body.importHash = linkData.hash;
                next();
            }).catch(err => {
                req.session.notification = {
                    'type': 'danger',
                    'message': `Fehler beim Erstellen des Registrierungslinks. Bitte selbstständig Registrierungslink im Nutzerprofil generieren und weitergeben. ${(err.error||{}).message || err.message || err || ""}`
                };
                res.redirect(req.header('Referer'));
            });
        }
    };
};

// secure routes
router.use(authHelper.authChecker);

// client-side use
router.post('/registrationlink/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), generateRegistrationLink({}), (req, res) => { res.json(res.locals.linkData);});

const sendMailHandler = (user, req, res, internalReturn) => {
    if (user && user.email && user.schoolId && (user.shortLink || res.locals.linkData.shortLink) ) {
        return api(req).post('/mails/', {
            json: {
                email: user.email,
                subject: `Einladung für die Nutzung der ${res.locals.theme.title}!`,
                headers: {},
                content: {
                    "text": `Einladung in die ${res.locals.theme.title}
Hallo ${user.firstName} ${user.lastName}!
\nDu wurdest eingeladen, der ${res.locals.theme.title} beizutreten, bitte vervollständige deine Registrierung unter folgendem Link: ${user.shortLink || res.locals.linkData.shortLink}
\nViel Spaß und einen guten Start wünscht dir dein
${res.locals.theme.short_title}-Team`
                }
            }
        }).then(_ => {
            if (internalReturn) return true;
            req.session.notification = {
                type: 'success',
                message: 'Nutzer erfolgreich erstellt und Registrierungslink per E-Mail verschickt.'
            };
            return res.redirect(req.header('Referer'));
        }).catch(err => {
            if (internalReturn) return false;
            req.session.notification = {
                'type': 'danger',
                'message': `Nutzer erstellt. Fehler beim Versenden der E-Mail. Bitte selbstständig Registrierungslink im Nutzerprofil generieren und weitergeben. ${(err.error||{}).message || err.message || err || ""}`
            };
            res.redirect(req.header('Referer'));
        });
    } else {
        if (internalReturn) return true;
        req.session.notification = {
            type: 'success',
            message: 'Nutzer erfolgreich erstellt.'
        };
        return res.redirect(req.header('Referer'));
    }
    /* deprecated code for template-based e-mails - we keep that for later copy&paste
    fs.readFile(path.join(__dirname, '../views/template/registration.hbs'), (err, data) => {
        if (!err) {
            let source = data.toString();
            let template = handlebars.compile(source);
            let outputString = template({
                "url": (req.headers.origin || process.env.HOST) + "/register/account/" + user._id,
                "firstName": user.firstName,
                "lastName": user.lastName
            });
            
            let content = {
                "html": outputString,
                "text": "Sehr geehrte/r " + user.firstName + " " + user.lastName + ",\n\n" +
                    "Sie wurden in die Schul-Cloud eingeladen, bitte registrieren Sie sich unter folgendem Link:\n" +
                    (req.headers.origin || process.env.HOST) + "/register/account/" + user._id + "\n\n" +
                    "Mit Freundlichen Grüßen" + "\nIhr Schul-Cloud Team"
            };
            req.body.content = content;
        }
    });*/
};


const getUserCreateHandler = (internalReturn) => {
    return function (req, res, next) {
        let shortLink = req.body.shortLink;
        if (req.body.birthday) {
            let birthday = req.body.birthday.split('.');
            req.body.birthday = `${birthday[2]}-${birthday[1]}-${birthday[0]}T00:00:00Z`;
        }
        return api(req).post('/users/', {
            json: req.body
        }).then(async newuser => {
            res.locals.createdUser = newuser;
            if (req.body.sendRegistration && newuser.email && newuser.schoolId) {
                newuser.shortLink = shortLink;
                return await sendMailHandler(newuser, req, res, internalReturn);
            } else {
                if (internalReturn) return true;
                req.session.notification = {
                    'type': 'success',
                    'message': 'Nutzer erfolgreich erstellt.'
                };
                res.redirect(req.header('Referer'));
            }
            /*
            createEventsForData(data, service, req, res).then(_ => {
                next();
            });
            */
        }).catch(err => {
            if (internalReturn) return false;
            req.session.notification = {
                'type': 'danger',
                'message': `Fehler beim Erstellen des Nutzers. ${err.error.message||""}`
            };
            res.redirect(req.header('Referer'));
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

const getCSVImportHandler = () => {
    return function (req, res, next) {
        let csvData = '';
        let records = [];
        let importCount = 0;

        try {
            const delimiters = [',',';','|','\t'];
            delimiters.some(delimiter => {
                csvData = decoder.write(req.file.buffer);
                records = parse(csvData, { columns: true, delimiter: delimiter });
                if(Object.keys(records[0]).length > 1){
                    return true;
                }
                return false;
            });
            if(Object.keys(records[0]).length <= 1){
                throw "PARSING FAILED";
            }
        } catch (err) {
            req.session.notification = {
                type: 'danger',
                message: 'Import fehlgeschlagen. (Format überprüfen)'
            };
        }

        const groupData = {
            schoolId: req.body.schoolId,
            roles: req.body.roles
        };

        const recordPromises = records.map(async (user) => {
            user = Object.assign(user, groupData);
            let linkdData = await (generateRegistrationLink({
                role:req.body.roles[0],
                save: true,
                toHash: user.email
            }, true))(req, res, next);
            return {user: user, linkData: linkdData};
        });

        Promise.all(recordPromises).then(async (allData) => {
            for (let data of allData) {
                if (req.body.sendRegistration) {
                    req.body = data.user;
                    req.body.sendRegistration = true;
                } else {
                    req.body = data.user;
                }
                req.body.importHash = data.linkData.hash;
                req.body.shortLink = data.linkData.shortLink;
                const success = await (getUserCreateHandler(true))(req, res, next);
                if(success){
                    importCount += 1;
                }
            }
            req.session.notification = {
                type: importCount?'success':'info',
                message: `${importCount} von ${records.length} Nutzer${records.length>1?'n':''} importiert.`
            };
            res.redirect(req.header('Referer'));
            return;
        }).catch(err => {
            res.redirect(req.header('Referer'));
            return;
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
                res.redirect(cutEditOffUrl(req.header('Referer')));
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


const getDeleteHandler = (service, redirectUrl) => {
    return function (req, res, next) {
        api(req).delete('/' + service + '/' + req.params.id).then(_ => {
            if(redirectUrl){
                res.redirect(redirectUrl);
            }else{
                res.redirect(req.header('Referer'));
        }
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
            api(req).post('/fileStorage/bucket', {
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
                    userClasses = userClasses + ' , ' + uClass.displayName||"";
                } else {
                    userClasses = uClass.displayName||"";
                }
            }
        });
    } else {
        classes.data.map(uClass => {
            if (uClass.userIds.includes(user._id)) {
                if (userClasses !== '') {
                    userClasses = userClasses + ' , ' + uClass.displayName||"";
                } else {
                    userClasses = uClass.displayName||"";
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
                ["email", "E-Mail-Adresse"],
                ["createdAt", "Erstelldatum"]
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

const getConsentStatusIcon = (consent, bool) => {
    if(bool && consent){
        if(consent.userConsent && consent.userConsent.privacyConsent && consent.userConsent.thirdPartyConsent && consent.userConsent.termsOfUseConsent && consent.userConsent.researchConsent){
            return `<i class="fa fa-check consent-status"></i>`;
        }else{
            return `<i class="fa fa-times consent-status"></i>`;
        }
    }
    if(consent){
        if(consent.requiresParentConsent){
            if((consent.parentConsents || []).length == 0 
                || !(consent.parentConsents[0].privacyConsent && consent.parentConsents[0].thirdPartyConsent && consent.parentConsents[0].termsOfUseConsent && consent.parentConsents[0].researchConsent)){
                return `<i class="fa fa-times consent-status"></i>`;
            }else{
                if(consent.userConsent && consent.userConsent.privacyConsent && consent.userConsent.thirdPartyConsent && consent.userConsent.termsOfUseConsent && consent.userConsent.researchConsent){
                    return `<i class="fa fa-check consent-status"></i>`;
                }else{
                    return `<i class="fa fa-circle-thin consent-status"></i>`;
                }
            }
        }else{
            if(consent.userConsent && consent.userConsent.privacyConsent && consent.userConsent.thirdPartyConsent && consent.userConsent.termsOfUseConsent && consent.userConsent.researchConsent){
                return `<i class="fa fa-check consent-status"></i>`;
            }else{
                return `<i class="fa fa-circle-thin consent-status"></i>`;
            }
        }
    }else{
        return `<i class="fa fa-times consent-status"></i>`;
    }
};

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
            res.render('administration/school', { 
                title: title + 'Allgemein', 
                school: data, 
                provider, 
                ssoTypes, 
                totalStorage: totalStorage,
                schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier
            });
        });
    });
});

const getTeacherUpdateHandler = () => {
    return async function (req, res, next) {
    
        let promises = [api(req).patch('/users/' + req.params.id, { json: req.body })]; // TODO: sanitize

        // extract consent
        if(req.body.form){
            let consent = {
                _id: req.body.consentId,
                userConsent: {
                    form: req.body.form || "analog",
                    privacyConsent: req.body.privacyConsent || false,
                    researchConsent: req.body.researchConsent || false,
                    thirdPartyConsent: req.body.thirdPartyConsent || false,
                    termsOfUseConsent: req.body.termsOfUseConsent || false
                }
            };
            if(consent._id){ // update exisiting consent
                promises.push(api(req).patch('/consents/' + consent._id, { json: consent }));
            } else { //create new consent entry
                delete consent._id;
                consent.userId = req.params.id;
                promises.push(api(req).post('/consents/', { json: consent }));
            }
        }

        // extract class information
        if(req.body.classes && !Array.isArray(req.body.classes)){
            req.body.classes = [req.body.classes];
        }
        const usersClasses = (await api(req).get('/classes', {
            qs: {
                teacherIds: req.params.id
            }
        })).data.map(c => {
            return c._id;
        });
        const addedClasses = (req.body.classes||[]).filter(function(i) {return !usersClasses.includes(i);});
        const removedClasses = usersClasses.filter(function(i) {return !(req.body.classes||[]).includes(i);});
        addedClasses.forEach((addClass) => {
            promises.push(api(req).patch('/classes/' + addClass, { json: { $push: { teacherIds: req.params.id }}}));
        });
        removedClasses.forEach((removeClass) => {
            promises.push(api(req).patch('/classes/' + removeClass, { json: { $pull: { teacherIds: req.params.id }}}));
        });

        // do all db requests
        Promise.all(promises).then(([user, consent]) => {
            res.redirect(cutEditOffUrl(req.header('Referer'))); 
        }).catch(err => {
            next(err);
        });
    };
};

router.post('/teachers/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), generateRegistrationLink({role:"teacher",patchUser:true,save:true}), getUserCreateHandler());
router.post('/teachers/import/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), upload.single('csvFile'), getCSVImportHandler());
router.post('/teachers/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), getTeacherUpdateHandler());
router.patch('/teachers/:id/pw', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), userIdtoAccountIdUpdate('accounts'));
router.get('/teachers/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), getDetailHandler('users'));
router.delete('/teachers/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), getDeleteAccountForUserHandler, getDeleteHandler('users', '/administration/teachers'));

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
    }).then(userData => {
        let users = userData.data;

        const classesPromise = getSelectOptions(req, 'classes', {});
        const consentsPromise = getSelectOptions(req, 'consents', {
            userId: {
                $in: users.map((user) => {
                    return user._id;
                })
            }
        });
        Promise.all([
            classesPromise,
            consentsPromise
        ]).then(([classes, consents]) => {

            users = users.map((user) => {
                // add consentStatus to user
                const consent = (consents||[]).find((consent) => {
                    return consent.userId == user._id;
                });

                user.consentStatus = `<p class="text-center m-0">${getConsentStatusIcon(consent, true)}</p>`;
                // add classes to user
                user.classesString = classes.filter((currentClass) => {
                    return currentClass.teacherIds.includes(user._id);
                }).map((currentClass) => {return currentClass.displayName;}).join(', ');
                return user;
            });

            let head = [
                'Vorname',
                'Nachname',
                'E-Mail-Adresse',
                'Klasse(n)'
            ];
            if(res.locals.currentUser.roles.map(role => {return role.name;}).includes("administrator")){
                head.push('Einwilligung');
                head.push('Erstellt am');
                head.push('');
            }
            let body = users.map(user => {
                let row = [
                    user.firstName || '',
                    user.lastName || '',
                    user.email || '',
                    user.classesString || ''
                ];
                if(res.locals.currentUser.roles.map(role => {return role.name;}).includes("administrator")){
                    row.push({
                        useHTML: true,
                        content: user.consentStatus
                    });
                    row.push(moment(user.createdAt).format('DD.MM.YYYY'));
                    row.push([{
                        link: `/administration/teachers/${user._id}/edit`,
                        title: 'Nutzer bearbeiten',
                        icon: 'edit'
                    }]);
                }
                return row;
            });

            const pagination = {
                currentPage,
                numPages: Math.ceil(userData.total / itemsPerPage),
                baseUrl: '/administration/teachers/?p={{page}}' + filterQueryString
            };

            res.render('administration/teachers', {
                title: title + 'Lehrer',
                head, body, pagination,
                filterSettings: JSON.stringify(userFilterSettings('lastName')),
                schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier
            });
        });
    });
});

router.get('/teachers/:id/edit', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), function (req, res, next) {
    const userPromise = api(req).get('/users/' + req.params.id);
    const consentPromise = getSelectOptions(req, 'consents', {userId: req.params.id});
    const classesPromise = getSelectOptions(req, 'classes', {$populate: ['year'], $sort: 'displayName'});
    const accountPromise = api(req).get('/accounts/', {qs: {userId: req.params.id}});

    Promise.all([
        userPromise,
        consentPromise,
        classesPromise,
        accountPromise
    ]).then(([user, consent, classes, account]) => {
        consent = consent[0];
        account = account[0];
        let hidePwChangeButton = account ? false : true;

        classes = classes.map(c => {
            c.selected = c.teacherIds.includes(user._id);
            return c;
        });
        res.render('administration/users_edit',
            {
                title: `Lehrer bearbeiten`,
                action: `/administration/teachers/${user._id}`,
                submitLabel : 'Speichern',
                closeLabel : 'Abbrechen',
                user,
                consentStatusIcon: getConsentStatusIcon(consent, true),
                consent,
                classes,
                editTeacher: true,
                hidePwChangeButton,
                isAdmin: res.locals.currentUser.permissions.includes("ADMIN_VIEW"),
                schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier
            }
        );
    });
});


/*
    STUDENTS
*/

const getStudentUpdateHandler = () => {
    return async function (req, res, next) {
        const birthday = req.body.birthday.split('.');
        req.body.birthday = `${birthday[2]}-${birthday[1]}-${birthday[0]}T00:00:00Z`;

        // extractConsent
        let studentConsent = {
            _id: req.body.student_consentId,
            userConsent: {
                form: req.body.student_form || "analog",
                privacyConsent: req.body.student_privacyConsent === "true",
                researchConsent: req.body.student_researchConsent === "true",
                thirdPartyConsent: req.body.student_thirdPartyConsent === "true",
                termsOfUseConsent: req.body.student_termsOfUseConsent === "true"
            }
        };
        let newParentConsent = {
            form: req.body.parent_form || "analog",
            privacyConsent: req.body.parent_privacyConsent === "true",
            researchConsent: req.body.parent_researchConsent === "true",
            thirdPartyConsent: req.body.parent_thirdPartyConsent === "true",
            termsOfUseConsent: req.body.parent_termsOfUseConsent === "true"
        };
        if(studentConsent._id){
            let orgUserConsent = await api(req).get('/consents/'+studentConsent._id);
            if(orgUserConsent.parentConsents && orgUserConsent.parentConsents[0]){
                orgUserConsent.parentConsents[0];
                Object.assign(orgUserConsent.parentConsents[0], newParentConsent);
                studentConsent.parentConsents = orgUserConsent.parentConsents;
            }
        }else if(studentConsent.userConsent.form){
            studentConsent.parentConsents = [newParentConsent];
        }
    
        // remove all consent infos from user post
        Object.keys(req.body).forEach(function(key) {
            if(key.startsWith("parent_") || key.startsWith("student_")){
                delete req.body[key];
            }
        });

        let promises = [api(req).patch('/users/' + req.params.id, { json: req.body })]; // TODO: sanitize

        if(studentConsent._id){ // update exisiting consent
            promises.push(api(req).patch('/consents/' + studentConsent._id, { json: studentConsent }));
        } else if(studentConsent.userConsent.form){//create new consent entry
            delete studentConsent._id;
            studentConsent.userId = req.params.id;
            promises.push(api(req).post('/consents/', { json: studentConsent }));
        }

        Promise.all(promises).then(([user, studentConsent]) => {
            res.redirect(cutEditOffUrl(req.header('Referer'))); 
        }).catch(err => {
            next(err);
        });
    };
};

router.post('/students/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), generateRegistrationLink({role:"student",patchUser:true,save:true}), getUserCreateHandler());
router.post('/students/import/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), upload.single('csvFile'), getCSVImportHandler());
router.patch('/students/:id/pw', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), userIdtoAccountIdUpdate('accounts'));
router.post('/students/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), getStudentUpdateHandler());
router.get('/students/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), getDetailHandler('users'));
router.delete('/students/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), getDeleteAccountForUserHandler, getDeleteHandler('users', '/administration/students'));

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
        const consentsPromise = getSelectOptions(req, 'consents', {
            userId: {
                $in: users.map((user) => {
                    return user._id;
                })
            },
            $limit: itemsPerPage
        });
        Promise.all([
            classesPromise,
            consentsPromise
        ]).then(([classes, consents]) => {
            users = users.map((user) => {
                // add consentStatus to user
                const consent = (consents||[]).find((consent) => {
                    return consent.userId == user._id;
                });

                user.consentStatus = `<p class="text-center m-0">${getConsentStatusIcon(consent)}</p>`;
                // add classes to user
                user.classesString = classes.filter((currentClass) => {
                    return currentClass.userIds.includes(user._id);
                }).map((currentClass) => {return currentClass.displayName;}).join(', ');
                return user;
            });

            const head = [
                'Vorname',
                'Nachname',
                'E-Mail-Adresse',
                'Klasse(n)',
                'Einwilligung',
                'Erstellt am',
                ''
            ];

            const body = users.map(user => {
                return [
                    user.firstName || '',
                    user.lastName || '',
                    user.email || '',
                    user.classesString || '',
                    {
                        useHTML: true,
                        content: user.consentStatus
                    },
                    moment(user.createdAt).format('DD.MM.YYYY'),
                    [{
                        link: `/administration/students/${user._id}/edit`,
                        title: 'Nutzer bearbeiten',
                        icon: 'edit'
                    }]
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
                filterSettings: JSON.stringify(userFilterSettings()),
                schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier
            });
        });
    });
});

router.get('/students/:id/edit', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), function (req, res, next) {
    const userPromise = api(req).get('/users/' + req.params.id);
    const consentPromise = getSelectOptions(req, 'consents', {userId: req.params.id});
    const accountPromise = api(req).get('/accounts/', {qs: {userId: req.params.id}});

    Promise.all([
        userPromise,
        consentPromise,
        accountPromise
    ]).then(([user, consent, account]) => {
        consent = consent[0];
        if(consent){
            consent.parentConsent = ((consent.parentConsents || []).length)?consent.parentConsents[0]:{};
        }
        account = account[0];
        let hidePwChangeButton = account ? false : true;
        res.render('administration/users_edit',
            {
                title: `Schüler bearbeiten`,
                action: `/administration/students/${user._id}`,
                submitLabel : 'Speichern',
                closeLabel : 'Abbrechen',
                user,
                consentStatusIcon: getConsentStatusIcon(consent),
                consent,
                hidePwChangeButton,
                schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier
            }
        );
    });
});



/* 
  CLASSES
*/

const renderClassEdit = (req, res, next, edit) => {
    api(req).get('/classes/')
    .then(classes => {
        let promises = [
            getSelectOptions(req, 'users', {roles: ['teacher', 'demoTeacher'], $limit: 1000}), //teachers
            getSelectOptions(req, 'years', {$sort: {name: -1}}),
            getSelectOptions(req, 'gradeLevels')
        ];
        if(edit){promises.push(api(req).get(`/classes/${req.params.classId}`));}

        Promise.all(promises).then(([teachers, schoolyears, gradeLevels, currentClass]) => {
            const isAdmin = res.locals.currentUser.permissions.includes("ADMIN_VIEW");
            if(!isAdmin){
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
                    if((currentClass.teacherIds||{}).includes(t._id)){t.selected = true;}
                });
                gradeLevels.forEach(g => {
                    if((currentClass.gradeLevel||{})._id == g._id) {
                        g.selected = true;
                    }
                });
                schoolyears.forEach(schoolyear => {
                    if((currentClass.year||{})._id === schoolyear._id) {schoolyear.selected = true;}
                });
                if (currentClass.nameFormat === "static") {
                    isCustom = true;
                    currentClass.customName = currentClass.name;
                    if (currentClass.year) {
                        currentClass.keepYear = true;
                    }
                } else if (currentClass.nameFormat === "gradeLevel+name") {
                    currentClass.classsuffix = currentClass.name;
                }              
            }

            res.render('administration/classes-edit', {
                title: `${edit?`Klasse '${currentClass.displayName}' bearbeiten`:"Erstelle eine neue Klasse"}`,
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
const getClassOverview = (req, res, next) => {
    let query = {
        $limit: 1000
    };
    if(req.query.yearId && req.query.yearId.length > 0){
        query.year = req.query.yearId;
    }
    api(req).get('/classes', {
        qs: query
    })
    .then(data => {
        res.json(data);
    }).catch(err => {
        next(err);
    });
};
router.get('/classes/create', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_CREATE'], 'or'), function (req, res, next) {
    renderClassEdit(req,res,next,false);
});
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
router.get('/classes/json', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), getClassOverview);
router.get('/classes/:classId/edit', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {
    renderClassEdit(req,res,next,true);
});
router.get('/classes/:id', getDetailHandler('classes'));
router.patch('/classes/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), mapEmptyClassProps, getUpdateHandler('classes'));
router.delete('/classes/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), getDeleteHandler('classes'));

router.get('/classes/:classId/manage', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {
    api(req).get('/classes/' + req.params.classId, { qs: { $populate: ['teacherIds', 'substitutionIds', 'userIds']}})
    .then(currentClass => {
        const classesPromise = getSelectOptions(req, 'classes', {$limit: 1000}); // TODO limit classes to scope (year before, current and without year)
        const teachersPromise = getSelectOptions(req, 'users', {roles: ['teacher', 'demoTeacher'], $sort: 'lastName', $limit:  1000});
        const studentsPromise = getSelectOptions(req, 'users', {roles: ['student', 'demoStudent'], $sort: 'lastName', $limit: 10000});
        const yearsPromise = getSelectOptions(req, 'years', {$limit: 10000});

        Promise.all([
            classesPromise,
            teachersPromise,
            studentsPromise,
            yearsPromise
        ]).then(([classes, teachers, students, schoolyears]) => {
            const isAdmin = res.locals.currentUser.permissions.includes("ADMIN_VIEW");
            if(!isAdmin){
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
            });
            res.render('administration/classes-manage', {
                title: `Klasse '${currentClass.displayName}' verwalten `,
                "class": currentClass,
                classes,
                teachers,
                students,
                schoolyears,
                notes: [
                    {
                        "title":"Deine Schüler sind unter 18 Jahre alt?",
                        "content":`Gib den Registrierungslink zunächst an die Eltern weiter. Diese legen die Schülerdaten an und erklären elektronisch ihr Einverständnis. Der Schüler ist dann in der ${res.locals.theme.short_title} registriert und du siehst ihn in deiner Klassenliste. Der Schüler kann sich mit seiner E-Mail-Adresse und dem individuellen Initial-Passwort einloggen. Nach dem ersten Login muss jeder Schüler sein Passwort ändern. Ist der Schüler über 14 Jahre alt, muss er zusätzlich selbst elektronisch sein Einverständnis erklären, damit er die ${res.locals.theme.short_title} nutzen kann.`
                    },
                    {
                        "title":"Deine Schüler sind mindestens 18 Jahre alt?",
                        "content":"Gib den Registrierungslink direkt an den Schüler weiter. Die Schritte für die Eltern entfallen automatisch."
                    },
                    /*{ // TODO - Feature not implemented
                        "title":"Deine Schüler sind in der Schülerliste rot?",
                        "content": `Sie sind vom Administrator bereits angelegt (z.B. durch Import aus Schüler-Verwaltungs-Software), aber es fehlen noch ihre Einverständniserklärungen. Lade die Schüler deiner Klasse und deren Eltern ein, ihr Einverständnis zur Nutzung der ${res.locals.theme.short_title} elektronisch abzugeben. Bereits erfasste Schülerdaten werden beim Registrierungsprozess automatisch gefunden und ergänzt.`
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
    };
    api(req).patch('/classes/' + req.params.classId, {
        // TODO: sanitize
        json: changedClass
    }).then(data => {
        res.redirect(`/administration/classes/`);
    }).catch(err => {
        next(err);
    });
});

router.post('/classes/create', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_CREATE'], 'or'), function (req, res, next) {
    let newClass = {
        schoolId: req.body.schoolId
    };
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
    };
    if (req.body.classcustom) {
        changedClass.name = req.body.classcustom;
        changedClass.nameFormat = "static";
        if (req.body.keepyear) {
            changedClass.year = req.body.schoolyear;
        }
    } else {
        req.body.classsuffix = req.body.classsuffix||"";
        changedClass.name = req.body.classsuffix;
        changedClass.gradeLevel = req.body.grade;
        changedClass.nameFormat = "gradeLevel+name";
        changedClass.year = req.body.schoolyear;
    }
    if (req.body.teacherIds) {
        changedClass.teacherIds = req.body.teacherIds;
    } else {
        changedClass.teacherIds = [];
    }
    api(req).patch('/classes/' + req.params.classId, {
        // TODO: sanitize
        json: changedClass
    }).then(data => {
        res.redirect(`/administration/classes/`);
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

const classFilterSettings = function (years) {
    return [
        {
            type: "sort",
            title: 'Sortierung',
            displayTemplate: 'Sortieren nach: %1',
            options: [
                ["displayName", "Klasse"]
            ],
            defaultSelection: "displayName",
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
            title: 'Jahrgang',
            displayTemplate: 'Jahrgang: %1',
            property: 'year',
            multiple: true,
            expanded: true,
            options: years
        },
    ];
};

router.all('/classes', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {

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

    let query = {
        $populate: ['teacherIds', 'year'],
        $limit: itemsPerPage,
        $skip: itemsPerPage * (currentPage - 1),
    };
    query = Object.assign(query, filterQuery);

    api(req).get('/classes', {
        qs: query
    }).then(async (data) => {
        const head = [
            'Klasse',
            'Lehrer',
            'Schuljahr',
            'Schüler',
            ''
        ];

        const body = data.data.map(item => {
            return [
                item.displayName||"",
                (item.teacherIds||[]).map(item => item.lastName).join(', '),
                (item.year||{}).name||"",
                (item.userIds.length)||'0',
                ((item, path)=>{return [
                    {
                        link: path + item._id + "/manage",
                        icon: 'users',
                        title: 'Klasse verwalten'
                    },
                    {
                        link: path + item._id + "/edit",
                        icon: 'edit',
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
            baseUrl: '/administration/classes/?p={{page}}' + filterQueryString
        };


        const years = (await api(req).get('/years')).data.map((year) => {return [year._id, year.name];});

        res.render('administration/classes', {
            title: 'Administration: Klassen',
            head,
            body,
            pagination,
            limit: true,
            filterSettings: JSON.stringify(classFilterSettings(years))
        });
    });
});

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

/*
    HELPDESK
*/

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
            'Erstellungsdatum',
            'Anmerkungen',
            ''
        ];

        const body = data.data.map(item => {
            return [
                truncate(item.subject||""),
                truncate(item.currentState||""),
                truncate(item.targetState||""),
                dictionary[item.category],
                dictionary[item.state],
                moment(item.createdAt).format('DD.MM.YYYY'),
                truncate(item.notes||""),
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

// general admin permissions
// ONLY useable with ADMIN_VIEW !

/*
    COURSES
*/

const getCourseCreateHandler = () => {
    return function (req, res, next) {
        api(req).post('/courses/', {
            json: req.body
        }).then(course => {
            createEventsForData(course, "courses", req, res).then(_ => {
                next();
            });
        }).catch(err => {
            next(err);
        });
    };
};

router.use(permissionsHelper.permissionsChecker('ADMIN_VIEW'));
router.patch('/schools/:id', getUpdateHandler('schools'));
router.post('/schools/:id/bucket', createBucket);
router.post('/courses/', mapTimeProps, getCourseCreateHandler());
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
                    (item.classIds || []).map(item => item.displayName).join(', '),
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

/*
    SYSTEMS
*/

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

module.exports = router;
