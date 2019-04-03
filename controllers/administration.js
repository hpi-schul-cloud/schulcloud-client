/*
 * One Controller per layout view
 */

const express = require('express');
const logger = require('winston');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const recurringEventsHelper = require('../helpers/recurringEvents');
const moment = require('moment');
const multer = require('multer');
const StringDecoder = require('string_decoder').StringDecoder;
const _ = require('lodash');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const decoder = new StringDecoder('utf8');

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
	if (url.endsWith('/edit')) {
		workingURL = workingURL.replace('/edit', '');
		workingURL = workingURL.substring(0, workingURL.lastIndexOf('/'));
	}
	return workingURL;
};

const getTableActions = (item, path, isAdmin = true, isTeacher = false, isStudentAction = false, category) => {
	let editButtonClass = 'btn-edit';
	if (item.type === 'ldap') {
		editButtonClass = 'btn-edit-ldap';
	}
	return [
		{
			link: item.type === 'ldap' ? `${path}ldap/edit/${item._id}` : path + item._id,
			class: `${editButtonClass} ${isTeacher ? 'disabled' : ''}`,
			icon: 'edit',
			title: 'Eintrag bearbeiten',
		},
		{
			link: path + item._id,
			class: `${isAdmin ? 'btn-delete' : 'disabled'} ${category === 'systems' && 'btn-delete--systems'}`,
			icon: 'trash-o',
			method: `${isAdmin ? 'delete' : ''}`,
			title: 'Eintrag löschen',
		},
		{
			link: isStudentAction ? path + 'pw/' + item._id : '',
			class: isStudentAction ? 'btn-pw' : 'invisible',
			icon: isStudentAction ? 'key' : '',
			title: 'Passwort zurücksetzen',
		}
	];
};

const getTableActionsSend = (item, path, state) => {
	let actions = [];
	if (state === 'submitted' || state === 'closed') {
		actions.push(
			{
				link: path + item._id,
				class: 'btn-edit',
				icon: 'edit',
				title: 'Eintrag bearbeiten',
			},
			{
				class: 'disabled',
				icon: 'archive',
			},
			{
				class: 'disabled',
				icon: 'paper-plane',
			},
		);
	} else {
		actions.push(
			{
				link: path + item._id,
				class: 'btn-edit',
				icon: 'edit',
				title: 'Eintrag bearbeiten',
			},
			{
				link: path + item._id,
				class: 'btn-disable',
				icon: 'archive',
				method: 'delete',
				title: 'Eintrag abschließen',
			},
			{
				link: path + item._id,
				class: 'btn',
				icon: 'paper-plane',
				method: 'post',
				title: 'Eintrag an Entwicklerteam senden',
			},
		);
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
	const courseBody = req.body;
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
	const classBody = req.body;
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

		if (internalReturn) {
			return api(req).post("/registrationlink/", {
				json: options
			});
		} else {
			return api(req).post("/registrationlink/", {
				json: options
			}).then(linkData => {
				res.locals.linkData = linkData;
				if (options.patchUser) req.body.importHash = linkData.hash;
				next();
			}).catch(err => {
				req.session.notification = {
					'type': 'danger',
					'message': `Fehler beim Erstellen des Registrierungslinks. Bitte selbstständig Registrierungslink im Nutzerprofil generieren und weitergeben. ${(err.error || {}).message || err.message || err || ""}`
				};
				res.redirect(req.header('Referer'));
			});
		}
	};
};

// secure routes
router.use(authHelper.authChecker);

// client-side use
router.post('/registrationlink/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), generateRegistrationLink({}), (req, res) => { res.json(res.locals.linkData); });

const sendMailHandler = (user, req, res, internalReturn) => {
	if (user && user.email && user.schoolId && (user.shortLink || res.locals.linkData.shortLink)) {
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
				'message': `Nutzer erstellt. Fehler beim Versenden der E-Mail. Bitte selbstständig Registrierungslink im Nutzerprofil generieren und weitergeben. ${(err.error || {}).message || err.message || err || ""}`
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
    }); */
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
				'message': `Fehler beim Erstellen des Nutzers. ${err.error.message || ""}`
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

				api(req).post('/helpdesk', {
					json: {
						type: "contactHPI",
						subject: data.subject,
						category: data.category,
						role: "",
						desire: "",
						benefit: "",
						acceptanceCriteria: "",
						currentState: data.currentState,
						targetState: data.targetState,
						notes: data.notes,
						schoolName: res.locals.currentSchoolData.name,
						userId: user._id,
						email: user.email ? user.email : "",
						schoolId: res.locals.currentSchoolData._id,
						cloud: res.locals.theme.title
					}
				})
					.then(_ => {
						api(req).patch('/' + service + '/' + req.params.id, {
							json: {
								state: 'submitted',
								order: 1
							}
						});
					}).catch(err => {
						res.status((err.statusCode || 500)).send(err);
					});
				res.redirect(req.get('Referrer'));
			});
	};
};

const getCSVImportHandler = () => {
	return async function (req, res, next) {
		try {
			const csvData = decoder.write(req.file.buffer);
			const [stats] = await api(req).post('/sync/', {
				qs: {
					target: 'csv',
					school: req.body.schoolId,
					role: req.body.roles[0],
					sendEmails: Boolean(req.body.sendRegistration),
				},
				json: {
					data: csvData,
				},
			});
			const numberOfUsers = stats.users.successful + stats.users.failed;
			if (stats.success) {
				req.session.notification = {
					type: 'success',
					message: `${stats.users.successful} von ${numberOfUsers} Nutzer${numberOfUsers > 1 ? 'n' : ''} importiert.`,
				};
			} else {
				const whitelist = ['file', 'user', 'invitation', 'class'];
				let errorText = stats.errors
					.filter(err => whitelist.includes(err.type))
					.map(err => `${err.entity} (${err.message})`)
					.join(', ');
				if (errorText === '') {
					errorText = 'Es ist ein unbekannter Fehler beim Importieren aufgetreten.';
				}
				req.session.notification = {
					type: 'warning',
					message: `${stats.users.successful} von ${numberOfUsers} Nutzer${numberOfUsers > 1 ? 'n' : ''} importiert. Fehler:\n\n${errorText}`,
				};
			}
			res.redirect(req.header('Referer'));
			return;
		} catch (err) {
			req.session.notification = {
				type: 'danger',
				message: 'Import fehlgeschlagen. Bitte überprüfe deine Eingabedaten und versuche es erneut.',
			};
			res.redirect(req.header('Referer'));
			return;
		}
	};
};

const dictionary = {
	open: 'Offen',
	closed: 'Geschlossen',
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
			if (redirectUrl) {
				res.redirect(redirectUrl);
			} else {
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
			res.redirect('/administration/school')
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
		{ label: 'IServ', value: 'iserv' },
		{ label: 'LDAP', value: 'ldap' },
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
					userClasses = userClasses + ' , ' + uClass.displayName || "";
				} else {
					userClasses = uClass.displayName || "";
				}
			}
		});
	} else {
		classes.data.map(uClass => {
			if (uClass.userIds.includes(user._id)) {
				if (userClasses !== '') {
					userClasses = userClasses + ' , ' + uClass.displayName || "";
				} else {
					userClasses = uClass.displayName || "";
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
					req.session.notification = {
						'type': 'success',
						'message': `Änderungen erfolgreich gespeichert.`
					};
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
			defaultSelection: (defaultOrder ? defaultOrder : "firstName"),
			defaultOrder: "DESC"
		},
		{
			type: "limit",
			title: 'Einträge pro Seite',
			displayTemplate: 'Einträge pro Seite: %1',
			options: [25, 50, 100],
			defaultSelection: 25
		},
		{
			type: "select",
			title: 'Einverständniserklärung Status',
			displayTemplate: 'Status: %1',
			property: 'consentStatus',
			multiple: true,
			expanded: true,
			options: [
				["missing", "Keine Einverständniserklärung vorhanden"],
				["parentsAgreed", "Eltern haben zugestimmt (oder Schüler ist über 16)"],
				["ok", "Alle Zustimmungen vorhanden"],
				[null, "nicht Angegeben"]
			]
		}
	];
};

const getConsentStatusIcon = (consent, bool = false) => {
	const check = '<i class="fa fa-check consent-status"></i>';
	const times = '<i class="fa fa-times consent-status"></i>'; // is red x
	const doubleCheck = '<i class="fa fa-check consent-status double-check"></i><i class="fa fa-check consent-status double-check"></i>';

	const isUserConsent = (c = {}) => {
		const uC = c.userConsent;
		return uC && uC.privacyConsent && uC.thirdPartyConsent && uC.termsOfUseConsent;
	};

	const isNOTparentConsent = (c = {}) => {
		const pCs = c.parentConsents || [];
		return pCs.length === 0 || !(pCs.privacyConsent && pCs.thirdPartyConsent && pCs.termsOfUseConsent);
	};

	if (!consent) {
		return times;
	}

	if (bool) {
		if (isUserConsent(consent)) {
			return check;
		}
		return times;
	}

	if (consent.requiresParentConsent) {
		if (isNOTparentConsent(consent)) {
			return times;
		}

		if (isUserConsent(consent)) {
			return doubleCheck;
		}
		return check;
	}

	if (isUserConsent(consent)) {
		return doubleCheck;
	}

	return check;
};

// teacher admin permissions
router.all('/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), function (req, res, next) {
	let title = returnAdminPrefix(res.locals.currentUser.roles);
	res.render('administration/dashboard', {
		title: title + 'Allgemein',
	});
});

const getTeacherUpdateHandler = () => {
	return async function (req, res, next) {

		let promises = [api(req).patch('/users/' + req.params.id, { json: req.body })]; // TODO: sanitize

		// extract consent
		if (req.body.form) {
			let consent = {
				_id: req.body.consentId,
				userConsent: {
					form: req.body.form || "analog",
					privacyConsent: req.body.privacyConsent || false,
					thirdPartyConsent: req.body.thirdPartyConsent || false,
					termsOfUseConsent: req.body.termsOfUseConsent || false
				}
			};
			if (consent._id) { // update exisiting consent
				promises.push(api(req).patch('/consents/' + consent._id, { json: consent }));
			} else { //create new consent entry
				delete consent._id;
				consent.userId = req.params.id;
				promises.push(api(req).post('/consents/', { json: consent }));
			}
		}

		// extract class information
		if (req.body.classes && !Array.isArray(req.body.classes)) {
			req.body.classes = [req.body.classes];
		}
		const usersClasses = (await api(req).get('/classes', {
			qs: {
				teacherIds: req.params.id
			}
		})).data.map(c => {
			return c._id;
		});
		const addedClasses = (req.body.classes || []).filter(function (i) { return !usersClasses.includes(i); });
		const removedClasses = usersClasses.filter(function (i) { return !(req.body.classes || []).includes(i); });
		addedClasses.forEach((addClass) => {
			promises.push(api(req).patch('/classes/' + addClass, { json: { $push: { teacherIds: req.params.id } } }));
		});
		removedClasses.forEach((removeClass) => {
			promises.push(api(req).patch('/classes/' + removeClass, { json: { $pull: { teacherIds: req.params.id } } }));
		});

		// do all db requests
		Promise.all(promises).then(([user, consent]) => {
			res.redirect(req.body.referrer);
		}).catch(err => {
			next(err);
		});
	};
};

router.post('/teachers/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), generateRegistrationLink({ role: "teacher", patchUser: true, save: true }), getUserCreateHandler());
router.post('/teachers/import/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), upload.single('csvFile'), getCSVImportHandler());
router.post('/teachers/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), getTeacherUpdateHandler());
router.patch('/teachers/:id/pw', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), userIdtoAccountIdUpdate('accounts'));
router.get('/teachers/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), getDetailHandler('users'));
router.delete('/teachers/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), getDeleteAccountForUserHandler, getDeleteHandler('users', '/administration/teachers'));

router.all('/teachers', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), function (req, res, next) {

	const tempOrgQuery = (req.query || {}).filterQuery;
	const filterQueryString = (tempOrgQuery) ? ('&filterQuery=' + escape(tempOrgQuery)) : '';

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
		let consentsPromise;

		const classesPromise = getSelectOptions(req, 'classes', {});
		if (users.length > 0) {
			consentsPromise = getSelectOptions(req, 'consents', {
				userId: {
					$in: users.map((user) => {
						return user._id;
					})
				}
			});
		} else {
			consentsPromise = Promise.resolve();
		}
		Promise.all([
			classesPromise,
			consentsPromise
		]).then(([classes, consents]) => {

			users = users.map((user) => {
				// add consentStatus to user
				const consent = (consents || []).find((consent) => {
					return consent.userId == user._id;
				});

				user.consentStatus = `<p class="text-center m-0">${getConsentStatusIcon(consent, true)}</p>`;
				// add classes to user
				user.classesString = classes.filter((currentClass) => {
					return currentClass.teacherIds.includes(user._id);
				}).map((currentClass) => { return currentClass.displayName; }).join(', ');
				return user;
			});

			let head = [
				'Vorname',
				'Nachname',
				'E-Mail-Adresse',
				'Klasse(n)'
			];
			if (res.locals.currentUser.roles.map(role => { return role.name; }).includes("administrator")) {
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
				if (res.locals.currentUser.roles.map(role => { return role.name; }).includes("administrator")) {
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
	const consentPromise = getSelectOptions(req, 'consents', { userId: req.params.id });
	const classesPromise = getSelectOptions(req, 'classes', { $populate: ['year'], $sort: 'displayName' });
	const accountPromise = api(req).get('/accounts/', { qs: { userId: req.params.id } });

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
				submitLabel: 'Speichern',
				closeLabel: 'Abbrechen',
				user,
				consentStatusIcon: getConsentStatusIcon(consent, true),
				consent,
				classes,
				editTeacher: true,
				hidePwChangeButton,
				isAdmin: res.locals.currentUser.permissions.includes("ADMIN_VIEW"),
				schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier,
				referrer: req.header('Referer'),
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

		let promises = [];

		// Consents
		if (req.body.student_form || req.body.parent_form) {
			let newConsent = {};
			if (req.body.student_form) {
				newConsent.userConsent = {
					form: req.body.student_form || "analog",
					privacyConsent: req.body.student_privacyConsent === "true",
					thirdPartyConsent: req.body.student_thirdPartyConsent === "true",
					termsOfUseConsent: req.body.student_termsOfUseConsent === "true"
				};
			}
			if (req.body.parent_form) {
				newConsent.parentConsents = []
				newConsent.parentConsents[0] = {
					form: req.body.parent_form || "analog",
					privacyConsent: req.body.parent_privacyConsent === "true",
					thirdPartyConsent: req.body.parent_thirdPartyConsent === "true",
					termsOfUseConsent: req.body.parent_termsOfUseConsent === "true"
				};
			}
			if (req.body.student_consentId) { // update exisiting consent
				promises.push(api(req).patch('/consents/' + req.body.student_consentId, { json: newConsent }));
			} else {//create new consent entry
				newConsent.userId = req.params.id;
				promises.push(api(req).post('/consents/', { json: newConsent }));
			}
		}

		// remove all consent infos from user post
		Object.keys(req.body).forEach(function (key) {
			if (key.startsWith("parent_") || key.startsWith("student_")) {
				delete req.body[key];
			}
		});

		promises.push(api(req).patch('/users/' + req.params.id, { json: req.body })); // TODO: sanitize

		Promise.all(promises).then(() => {
			res.redirect(req.body.referrer);
		}).catch(err => {
			next(err);
		});
	};
};

router.post('/students/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), generateRegistrationLink({ role: "student", patchUser: true, save: true }), getUserCreateHandler());
router.post('/students/import/', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), upload.single('csvFile'), getCSVImportHandler());
router.patch('/students/:id/pw', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), userIdtoAccountIdUpdate('accounts'));
router.post('/students/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), getStudentUpdateHandler());
router.get('/students/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), getDetailHandler('users'));
router.delete('/students/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), getDeleteAccountForUserHandler, getDeleteHandler('users', '/administration/students'));

router.all('/students', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), async (req, res, next) => {
	const users = await api(req).get('/users/admin/students')
		.catch((err) => {
			logger.error(`Can not fetch data from /users/admin/students in router.all("/students") | message: ${err.message} | code: ${err.code}.`);
			return [];
		});

	const title = `${returnAdminPrefix(res.locals.currentUser.roles)}Schüler`;
	let studentsWithoutConsentCount = 0;
	const head = [
		'Vorname',
		'Nachname',
		'E-Mail-Adresse',
		'Klasse(n)',
		'Einwilligung',
		'Erstellt am',
		'',
	];

	const body = users.map((user) => {
		const icon = getConsentStatusIcon(user.consent);
		if (icon === '<i class="fa fa-times consent-status"></i>') { // bad but helper functions only return icons
			studentsWithoutConsentCount += 1;
		}
		return [
			user.firstName || '',
			user.lastName || '',
			user.email || '',
			user.classes.join(', ') || '',
			{
				useHTML: true,
				content: `<p class="text-center m-0">${icon}</p>`,
			},
			moment(user.createdAt).format('DD.MM.YYYY'),
			[{
				link: `/administration/students/${user._id}/edit`,
				title: 'Nutzer bearbeiten',
				icon: 'edit',
			}],
		];
	});
/*  for pagination....

	const tempOrgQuery = (req.query || {}).filterQuery;
	const filterQueryString = (tempOrgQuery) ? (`&filterQuery=${escape(tempOrgQuery)}`) : '';

	let itemsPerPage = allStudentsCount;
	let filterQuery = {};
	if (tempOrgQuery) {
		filterQuery = JSON.parse(unescape(req.query.filterQuery));
		if (filterQuery.$limit) {
			itemsPerPage = filterQuery.$limit;
		}
	}

	const currentPage = parseInt(req.query.p, 10) || 1;

	const pagination = {
		currentPage,
		numPages: Math.ceil(allStudentsCount / itemsPerPage),
		baseUrl: `/administration/students/?p={{page}}${filterQueryString}`,
	};
	*/
	// const studentsWithoutConsent = 0; // await getUsersWithoutConsent(req, 'student');
	try {
		res.render('administration/students', {
			title,
			head,
			body,
			// pagination,
			filterSettings: JSON.stringify(userFilterSettings()),
			schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier,
			studentsWithoutConsentCount,
			allStudentsCount: users.length,
		});
	} catch (err) {
		logger.warn('Can not render /administration/students in router.all("/students")');
		next(err);
	}
});

const getUsersWithoutConsent = async (req, roleName, classId) => {
	const role = await api(req).get('/roles', { qs: { name: roleName }, $limit: false });
	const qs = { roles: role.data[0]._id, $limit: false };
	let users = [];

	if (classId) {
		const klass = await api(req).get('/classes/' + classId, {
			qs: {
				$populate: ['teacherIds', 'userIds'],
			}
		});
		users = klass.userIds.concat(klass.teacherIds);
	} else {
		users = (await api(req).get('/users', { qs, $limit: false })).data;
	}

	let consents = [];
	const batchSize = 50;
	let slice = 0;
	while (slice * batchSize <= users.length) {
		consents = consents.concat((await api(req).get('/consents', {
			qs: {
				userId: { $in: users.slice(slice * batchSize, (slice + 1) * batchSize).map(u => u._id) },
				$populate: 'userId',
				$limit: false,
			}
		})).data);
		slice += 1;
	}

	const consentMissing = (user) => {
		return !consents.some(consent => consent.userId._id.toString() === user._id.toString());
	}
	const consentIncomplete = (consent) => {
		return !consent.access;
	}

	const usersWithoutConsent = users.filter(consentMissing);
	const usersWithIncompleteConsent = consents.filter(consentIncomplete).map(c => c.userId);
	return usersWithoutConsent.concat(usersWithIncompleteConsent);
};


router.get('/users-without-consent/send-email', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), async function (req, res, next) {
	let usersWithoutConsent = await getUsersWithoutConsent(req, req.query.role, req.query.classId);
	const role = req.query.role;

	usersWithoutConsent = await Promise.all(usersWithoutConsent.map(async user => {
		user.registrationLink = await (generateRegistrationLink({
			role,
			save: true,
			host: process.env.HOST,
			schoolId: res.locals.currentSchool,
			toHash: user.email,
			patchUser: true
		}, true)(req, res, next));

		return Promise.resolve(user);
	}));

	try {
		for (const user of usersWithoutConsent) {
			const name = !!user.displayName ? user.displayName : `${user.firstName} ${user.lastName}`;
			const content = {
				text: `Hallo ${name},
Leider fehlt uns von dir noch die Einverständniserklärung.
Ohne diese kannst du die Schul-Cloud leider nicht nutzen.

Melde dich bitte mit deinen Daten an, um die Einverständiserklärung zu akzeptieren um die Schul-Cloud im vollen Umfang nutzen zu können.

Gehe jetzt auf <a href="${user.registrationLink.shortLink}">${user.registrationLink.shortLink}</a>, und melde dich an.`
			};

			const json = {
				headers: {},
				email: user.email,
				subject: `Der letzte Schritt zur Aktivierung für die ${res.locals.theme.short_title}`,
				content
			};

			await api(req).post('/mails', {
				json
			});
		}
		res.sendStatus(200);
	} catch (err) {
		res.status((err.statusCode || 500)).send(err);
	}
});

router.get('/users-without-consent/get-json', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), async function (req, res, next) {
	const role = req.query.role;

	try {
		let usersWithoutConsent = await getUsersWithoutConsent(req, role, req.query.classId);

		usersWithoutConsent = await Promise.all(usersWithoutConsent.map(async user => {
			user.registrationLink = await (generateRegistrationLink({
				role,
				save: true,
				host: process.env.HOST,
				schoolId: res.locals.currentSchool,
				toHash: user.email,
				patchUser: true
			}, true)(req, res, next));

			return Promise.resolve(user);
		}));

		res.json(usersWithoutConsent);
	} catch (err) {
		res.status((err.statusCode || 500)).send(err);
	}
});


router.get('/students/:id/edit', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'), function (req, res, next) {
	const userPromise = api(req).get('/users/' + req.params.id);
	const consentPromise = getSelectOptions(req, 'consents', { userId: req.params.id });
	const accountPromise = api(req).get('/accounts/', { qs: { userId: req.params.id } });

	Promise.all([
		userPromise,
		consentPromise,
		accountPromise
	]).then(([user, consent, account]) => {
		consent = consent[0];
		if (consent) {
			consent.parentConsent = ((consent.parentConsents || []).length) ? consent.parentConsents[0] : {};
		}
		account = account[0];
		let hidePwChangeButton = account ? false : true;
		res.render('administration/users_edit',
			{
				title: `Schüler bearbeiten`,
				action: `/administration/students/${user._id}`,
				submitLabel: 'Speichern',
				closeLabel: 'Abbrechen',
				user,
				consentStatusIcon: getConsentStatusIcon(consent),
				consent,
				hidePwChangeButton,
				schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier,
				referrer: req.header('Referer'),
			}
		);
	}).catch(err => {
		next(err);
	});
});


/*
  CLASSES
*/

const renderClassEdit = (req, res, next, edit) => {
	api(req).get('/classes/')
		.then(classes => {
			let promises = [
				getSelectOptions(req, 'users', { roles: ['teacher', 'demoTeacher'], $limit: false }), //teachers
				getSelectOptions(req, 'years', { $sort: { name: -1 } }),
				getSelectOptions(req, 'gradeLevels')
			];
			if (edit) { promises.push(api(req).get(`/classes/${req.params.classId}`)); }

			Promise.all(promises).then(([teachers, schoolyears, gradeLevels, currentClass]) => {
				gradeLevels.sort((a, b) => parseInt(a.name) - parseInt(b.name));

				const isAdmin = res.locals.currentUser.permissions.includes("ADMIN_VIEW");
				if (!isAdmin) {
					// preselect current teacher when creating new class and the current user isn't a admin (teacher)
					teachers.forEach(t => {
						if (JSON.stringify(t._id) === JSON.stringify(res.locals.currentUser._id)) {
							t.selected = true;
						}
					});
				}
				let isCustom = false;
				if (currentClass) {
					// preselect already selected teachers
					teachers.forEach(t => {
						if ((currentClass.teacherIds || {}).includes(t._id)) { t.selected = true; }
					});
					gradeLevels.forEach(g => {
						if ((currentClass.gradeLevel || {})._id == g._id) {
							g.selected = true;
						}
					});
					schoolyears.forEach(schoolyear => {
						if ((currentClass.year || {})._id === schoolyear._id) { schoolyear.selected = true; }
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
					title: `${edit ? `Klasse '${currentClass.displayName}' bearbeiten` : "Erstelle eine neue Klasse"}`,
					edit,
					schoolyears,
					teachers,
					class: currentClass,
					gradeLevels,
					isCustom,
					referrer: '/administration/classes/',
				});
			});
		}).catch(err => {
			next(err);
		});
};
const getClassOverview = (req, res, next) => {
	let query = {
		$limit: 1000
	};
	if (req.query.yearId && req.query.yearId.length > 0) {
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
	renderClassEdit(req, res, next, false);
});
router.get('/classes/students', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {
	const classIds = JSON.parse(req.query.classes);
	api(req).get('/classes/', {
		qs: {
			$populate: ['userIds'],
			_id: {
				$in: classIds
			}
		}
	})
		.then(classes => {
			const students = classes.data.map((c) => {
				return c.userIds;
			}).reduce((flat, next) => { return flat.concat(next); }, []);
			res.json(students);
		});
});
router.get('/classes/json', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), getClassOverview);
router.get('/classes/:classId/edit', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {
	renderClassEdit(req, res, next, true);
});
router.get('/classes/:id', getDetailHandler('classes'));
router.patch('/classes/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), mapEmptyClassProps, getUpdateHandler('classes'));
router.delete('/classes/:id', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), getDeleteHandler('classes'));

router.get('/classes/:classId/manage', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'USERGROUP_EDIT'], 'or'), function (req, res, next) {
	api(req).get('/classes/' + req.params.classId, { qs: { $populate: ['teacherIds', 'substitutionIds', 'userIds'] } })
		.then(currentClass => {
			const classesPromise = getSelectOptions(req, 'classes', { $limit: false }); // TODO limit classes to scope (year before, current and without year)
			const teachersPromise = getSelectOptions(req, 'users', { roles: ['teacher', 'demoTeacher'], $sort: 'lastName', $limit: false });
			const studentsPromise = getSelectOptions(req, 'users', { roles: ['student', 'demoStudent'], $sort: 'lastName', $limit: false });
			const yearsPromise = getSelectOptions(req, 'years', { $limit: false });

			Promise.all([
				classesPromise,
				teachersPromise,
				studentsPromise,
				yearsPromise
			]).then(([classes, teachers, students, schoolyears]) => {
				const isAdmin = res.locals.currentUser.permissions.includes("ADMIN_VIEW");
				if (!isAdmin) {
					// preselect current teacher when creating new class and the current user isn't a admin (teacher)
					teachers.forEach(t => {
						if (JSON.stringify(t._id) === JSON.stringify(res.locals.currentUser._id)) {
							t.selected = true;
						}
					});
				}
				// preselect current teacher when creating new class

				const teacherIds = currentClass.teacherIds.map(t => { return t._id; });
				teachers.forEach(t => {
					if (teacherIds.includes(t._id)) {
						t.selected = true;
					}
				});
				const studentIds = currentClass.userIds.map(t => { return t._id; });
				students.forEach(s => {
					if (studentIds.includes(s._id)) {
						s.selected = true;
					}
				});
				res.render('administration/classes-manage', {
					title: `Klasse '${currentClass.displayName}' verwalten `,
					class: currentClass,
					classes,
					teachers,
					students,
					schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier,
					schoolyears,
					notes: [
						{
							"title": "Deine Schüler sind unter 16 Jahre alt?",
							"content": `Gib den Registrierungslink zunächst an die Eltern weiter. Diese legen die Schülerdaten an und erklären elektronisch ihr Einverständnis. Der Schüler ist dann in der ${res.locals.theme.short_title} registriert und du siehst ihn in deiner Klassenliste. Der Schüler kann sich mit seiner E-Mail-Adresse und dem individuellen Initial-Passwort einloggen. Nach dem ersten Login muss jeder Schüler sein Passwort ändern. Ist der Schüler über 14 Jahre alt, muss er zusätzlich selbst elektronisch sein Einverständnis erklären, damit er die ${res.locals.theme.short_title} nutzen kann.`
						},
						{
							"title": "Deine Schüler sind mindestens 16 Jahre alt?",
							"content": "Gib den Registrierungslink direkt an den Schüler weiter. Die Schritte für die Eltern entfallen automatisch."
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
							"title": "Passwort ändern",
							"content": "Beim ersten Login muss der Schüler sein Passwort ändern. Hat er eine E-Mail-Adresse angegeben, kann er sich das geänderte Passwort zusenden lassen oder sich bei Verlust ein neues Passwort generieren. Alternativ kannst du im Bereich Verwaltung > Schüler hinter dem Schülernamen auf Bearbeiten klicken. Dann kann der Schüler an deinem Gerät sein Passwort neu eingeben."
						},
					],
					referrer: '/administration/classes/',
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
		res.redirect(req.body.referrer);
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
		if (isAdmin) {
			res.redirect(`/administration/classes/`);
		} else {
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
		req.body.classsuffix = req.body.classsuffix || "";
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
		res.redirect(req.body.referrer);
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
			options: [25, 50, 100],
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

	const tempOrgQuery = (req.query || {}).filterQuery;
	const filterQueryString = (tempOrgQuery) ? ('&filterQuery=' + escape(tempOrgQuery)) : '';

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
				item.displayName || "",
				(item.teacherIds || []).map(item => item.lastName).join(', '),
				(item.year || {}).name || "",
				(item.userIds.length) || '0',
				((item, path) => {
					return [
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
					];
				})(item, '/administration/classes/')
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


		const years = (await api(req).get('/years')).data.map((year) => { return [year._id, year.name]; });

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
			$sort: req.query.sort ? req.query.sort : { order: 1 },
			"schoolId": res.locals.currentSchool
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
				truncate(item.subject || ""),
				truncate(item.currentState || ""),
				truncate(item.targetState || ""),
				(item.category === "") ? "" : dictionary[item.category],
				dictionary[item.state],
				moment(item.createdAt).format('DD.MM.YYYY'),
				truncate(item.notes || ""),
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

		res.render('administration/helpdesk', { title: title + 'Helpdesk', head, body, pagination, limit: true });
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

const schoolUpdateHandler = async function (req, res, next) {
	const isChatAllowed = (res.locals.currentSchoolData.features || []).includes("rocketChat");
	if (!isChatAllowed && req.body.rocketchat === "true") {
		// add rocketChat feature
		await api(req).patch('/schools/' + req.params.id, {
			json: {
				$push: {
					features: "rocketChat"
				}
			}
		});
	} else if (isChatAllowed && req.body.rocketchat !== "true") {
		// remove rocketChat feature
		await api(req).patch('/schools/' + req.params.id, {
			json: {
				$pull: {
					features: "rocketChat"
				}
			}
		});
	}
	delete req.body.rocketchat;
	return getUpdateHandler('schools')(req, res, next);
}


router.use(permissionsHelper.permissionsChecker('ADMIN_VIEW'));
router.patch('/schools/:id', schoolUpdateHandler);
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

router.all('/teams', function (req, res, next) {

	const itemsPerPage = (req.query.limit || 10);
	const currentPage = parseInt(req.query.p) || 1;

	api(req).get('/teams/manage/admin', {
		qs: {
			$populate: ['userIds'],
			$limit: itemsPerPage,
			$skip: itemsPerPage * (currentPage - 1),
			$sort: req.query.sort
		}
	}).then(data => {

		const head = [
			'Name',
			'Klasse(n)',
			''
		];

		const classesPromise = getSelectOptions(req, 'classes', { $limit: 1000 });
		const usersPromise = getSelectOptions(req, 'users', { $limit: 1000 });

		Promise.all([
			classesPromise,
			usersPromise
		]).then(([classes, users]) => {
			const body = data.map(item => {
				return [
					item.name,
					(item.classIds || []).map(item => item.displayName).join(', '),
					getTableActions(item, '/administration/teams/').map(action => {
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
				baseUrl: '/administration/teams/?p={{page}}' + sortQuery + limitQuery
			};

			res.render('administration/teams', {
				title: 'Administration: Teams',
				head,
				body,
				classes,
				users,
				pagination,
				limit: true
			});
		});
	});
});

router.get('/teams/:id', (req, res, next) => {
	api(req).get('/teams/manage/admin/' + req.params.id).then(data => {
		res.json(mapEventProps(data));
	}).catch(err => {
		next(err);
	});
});

router.patch('/teams/:id', (req, res, next) => {
	api(req).patch('/teams/manage/admin/' + req.params.id, {
		userId: req.body.userId
	}).then(data => {
		res.redirect('/administration/teams/');
	}).catch(err => {
		next(err);
	});
});

router.delete('/teams/:id', (req, res, next) => {
	api(req).delete('/teams/manage/admin/' + req.params.id).then(data => {
		res.redirect('/administration/teams/');
	}).catch(err => {
		next(err);
	});
});



/*
    SCHOOL / SYSTEMS / RSS
*/

router.post('/systems/', createSystemHandler);
router.patch('/systems/:id', getUpdateHandler('systems'));
router.get('/systems/:id', getDetailHandler('systems'));
router.delete('/systems/:id', removeSystemFromSchoolHandler, getDeleteHandler('systems'));

router.get('/rss/:id', async (req, res) => {
	const school = await api(req).patch('/schools/' + res.locals.currentSchool);

	const matchingRSSFeed = school.rssFeeds.find(feed => feed._id === req.params.id);

	res.send(matchingRSSFeed);
})

router.post('/rss/', async (req, res) => {
	const school = await api(req).get('/schools/' + req.body.schoolId);

	if (school.rssFeeds && school.rssFeeds.find(el => el.url === req.body.rssURL)) {
		return res.redirect('/administration/school');
	}

	await api(req).patch('/schools/' + req.body.schoolId, {
		json: {
			$push: {
				rssFeeds: { url: req.body.rssURL, description: req.body.description }
			}
		}
	});
	res.redirect('/administration/school');
});

router.delete('/rss/:id', async (req, res) => {
	await api(req).patch('/schools/' + res.locals.currentSchool, {
		json: {
			$pull: {
				rssFeeds: { _id: req.params.id }
			}
		}
	});

	res.redirect('/administration/school');
});

router.use('/school', permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'), async function (req, res, next) {

	const [school, totalStorage] = await Promise.all([api(req).get('/schools/' + res.locals.currentSchool, {
		qs: {
			$populate: ['systems'],
			$sort: req.query.sort
		}
	}), api(req).get('/fileStorage/total')]);

	// SYSTEMS
	const systemsHead = [
		'Alias',
		'Typ',
		'',
	];
	let systemsBody;
	let systems;
	if (school.systems) {
		school.systems = _.orderBy(school.systems, req.query.sort, 'desc');
		systems = school.systems.filter(system => system.type != 'local');

		systemsBody = systems.map(item => {
			let name = getSSOTypes().filter(type => item.type === type.value);
			return [
				item.alias,
				name,
				getTableActions(item, '/administration/systems/', true, false, false, 'systems'),
			];
		});
	}

	// RSS
	const rssHead = ['URL', 'Kurzbeschreibung', 'Status', ''];
	let rssBody;
	if (school.rssFeeds) {
		rssBody = school.rssFeeds.map(({ _id, url, status, description }) => [
			url,
			description,
			status === 'success' ? 'Aktiv' : status === 'error' ? 'Fehler beim Abrufen' : 'In der Warteschlange',
			[{
				link: `/administration/rss/${_id}`,
				class: 'btn-delete--rss',
				icon: 'trash-o',
				method: 'delete',
				title: 'Eintrag löschen',
			}],
		]);
	}

	// SCHOOL
	let title = returnAdminPrefix(res.locals.currentUser.roles);
	let provider = getStorageProviders();
	provider = (provider || []).map(prov => {
		if (prov.value == school.fileStorageType) {
			return Object.assign(prov, {
				selected: true
			});
		} else {
			return prov;
		}
	});

	const ssoTypes = getSSOTypes();

	res.render('administration/school', {
		title: title + 'Schule',
		school,
		systems,
		provider,
		availableSSOTypes: ssoTypes,
		ssoTypes,
		totalStorage,
		systemsHead,
		systemsBody,
		rssHead,
		rssBody,
		hasRSS: rssBody && !!rssBody.length,
		schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier,
	});
});

/*
    LDAP SYSTEMS
*/

router.post('/systems/ldap/add', permissionsHelper.permissionsChecker('ADMIN_VIEW'), function (req, res, next) {
	//Create System for LDAP
	const ldapTemplate = {
		type: 'ldap',
		alias: res.locals.currentSchoolData.name,
		ldapConfig: {
			active: false,
			url: 'ldaps://',
			rootPath: '',
			searchUser: '',
			searchUserPassword: '',
			provider: 'general',
			providerOptions: {
				schoolName: res.locals.currentSchoolData.name,
				userPathAdditions: '',
				classPathAdditions: '',
				roleType: 'text',
				userAttributeNameMapping: {
					givenName: 'givenName',
					sn: 'sn',
					dn: 'dn',
					uuid: 'objectGUID',
					uid: 'cn',
					mail: 'mail',
					role: 'description',
				},
				roleAttributeNameMapping: {
					roleStudent: 'student',
					roleTeacher: 'teacher',
					roleAdmin: 'admin',
					roleNoSc: 'no-sc',
				},
				classAttributeNameMapping: {
					description: 'name',
					dn: 'dn',
					uniqueMember: 'member',
				},
			}
		}
	};

	api(req).post('/systems/', { json: ldapTemplate }).then(system => {
		api(req).patch('/schools/' + res.locals.currentSchool, {
			json: {
				$push: {
					systems: system._id
				}
			}
		}).then(data => {
			res.redirect(`/administration/systems/ldap/edit/${system._id}`);
		}).catch(err => {
			next(err);
		});
	});
});
router.get('/systems/ldap/edit/:id', permissionsHelper.permissionsChecker('ADMIN_VIEW'), async function (req, res, next) {

	//Find LDAP-System
	const school = await Promise.resolve(api(req).get('/schools/' + res.locals.currentSchool, {
		qs: {
			$populate: ['systems']
		}
	}));
	system = school.systems.filter(system => system._id === req.params.id);

	if (system.length == 1) {
		res.render('administration/ldap-edit', {
			title: 'LDAP bearbeiten',
			system: system[0],
		});
	} else {
		const err = new Error('Not Found');
		err.status = 404;
		next(err);
	}

});
// Verify
router.post('/systems/ldap/edit/:id', permissionsHelper.permissionsChecker('ADMIN_VIEW'), async function (req, res, next) {

	//Find LDAP-System
	const school = await Promise.resolve(api(req).get('/schools/' + res.locals.currentSchool, {
		qs: {
			$populate: ['systems']
		}
	}));
	system = school.systems.filter(system => system._id === req.params.id);

	//Classes acitve
	let classesPath = req.body.classpath;
	if (req.body.activateclasses !== 'on') {
		classesPath = '';
	}

	let ldapURL = req.body.ldapurl;
	if (!ldapURL.startsWith('ldaps')) {
		if (ldapURL.includes('ldap')) {
			ldapURL = ldapURL.replace('ldap', 'ldaps');
		} else {
			ldapURL = `ldaps://${ldapURL}`;
		}
	}

	api(req).patch('/systems/' + system[0]._id, {
		json: {
			alias: req.body.ldapalias,
			ldapConfig: {
				active: false,
				url: ldapURL,
				rootPath: req.body.rootpath,
				searchUser: req.body.searchuser,
				searchUserPassword: req.body.searchuserpassword,
				provider: req.body.ldaptype,
				providerOptions: {
					schoolName: res.locals.currentSchoolData.name,
					userPathAdditions: req.body.userpath,
					classPathAdditions: classesPath,
					roleType: req.body.roletype,
					userAttributeNameMapping: {
						givenName: req.body.givenName,
						sn: req.body.sn,
						dn: req.body.dn,
						uuid: req.body.uuid,
						uid: req.body.uid,
						mail: req.body.mail,
						role: req.body.role,
					},
					roleAttributeNameMapping: {
						roleStudent: req.body.studentrole,
						roleTeacher: req.body.teacherrole,
						roleAdmin: req.body.adminrole,
						roleNoSc: req.body.noscrole,
					},
					classAttributeNameMapping: {
						description: req.body.classdescription,
						dn: req.body.classdn,
						uniqueMember: req.body.classuniquemember,
					},
				}
			}
		}
	}).then(data => {

		api(req).get('/ldap/' + system[0]._id).then(data => {
			res.json(data);
		})
	}).catch(err => {
		res.json('{}');
	});
});

// Activate
router.post('/systems/ldap/activate/:id', permissionsHelper.permissionsChecker('ADMIN_VIEW'), async function (req, res, next) {

	//Find LDAP-System
	const school = await Promise.resolve(api(req).get('/schools/' + res.locals.currentSchool, {
		qs: {
			$populate: ['systems']
		}
	}));
	system = school.systems.filter(system => system._id === req.params.id);

	api(req).patch('/systems/' + system[0]._id, {
		json: {
			'ldapConfig.active': true,
		}
	}).then(data => {
		return api(req).patch('/schools/' + school._id, {
			json: {
				ldapSchoolIdentifier: system[0].ldapConfig.rootPath
			}
		});
	}).then(data => {
		res.json('success');
	}).catch(err => {
		res.json('error');
	});
});


module.exports = router;
