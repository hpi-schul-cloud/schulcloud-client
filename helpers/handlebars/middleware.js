const url = require('url');
const { Configuration } = require('@hpi-schul-cloud/commons');
const api = require('../../api');
const {
	PUBLIC_BACKEND_URL,
	FEATURE_EXTENSIONS_ENABLED,
	NOTIFICATION_SERVICE_ENABLED,
	FEATURE_TEAMS_ENABLED,
	FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED,
} = require('../../config/global');

const makeActive = (items, currentUrl) => {
	currentUrl += '/';

	if (currentUrl.split('/')[1] === 'courses') {
		const coursesSidebarItems = items.filter((i) => i.link === '/rooms-overview/');
		coursesSidebarItems.forEach((item) => {
			item.class = 'active';
		});
		return items;
	}

	const homeworkRegex = /homework\/*/i;
	if (currentUrl.match(homeworkRegex)) {
		const homeworkSidebarItems = items.filter((i) => i.link === '/tasks');
		homeworkSidebarItems.forEach((item) => {
			item.class = 'active';
		});

		return items;
	}

	return items.map((item) => {
		const regex = new RegExp(`^${item.link}`, 'i');

		if (currentUrl.replace(regex, '') === '') {
			item.class = 'active';
			item.childActive = true;
		} else if (currentUrl.match(regex)) {
			if (item.children) {
				item.class = 'child-active';
			} else {
				item.class = 'active';
			}
			item.childActive = true;
		}

		if (item.children && item.childActive) {
			item.children = makeActive(item.children, currentUrl);

			if (item.children.filter((child) => child.class == 'active').length == 0) {
				item.class += ' active';
			}
		}

		return item;
	});
};

module.exports = (req, res, next) => {
	res.locals.backendUrl = PUBLIC_BACKEND_URL;

	// standard views
	res.locals.sidebarItems = [{
		name: res.$t('global.link.overview'),
		testId: 'Übersicht',
		icon: 'view-grid-outline',
		link: '/dashboard/',
	},
	{
		name: res.$t('global.sidebar.link.administrationCourses'),
		testId: 'Course-Overview',
		icon: 'school-outline',
		link: '/rooms-overview/',
	}, {
		name: res.$t('global.headline.tasks'),
		testId: 'Aufgaben',
		icon: 'format-list-checks',
		link: '/tasks',
		permission: 'TASK_DASHBOARD_VIEW_V3',
	}, {
		name: res.$t('global.headline.tasks'),
		testId: 'Aufgaben',
		icon: 'format-list-checks',
		link: '/tasks',
		permission: 'TASK_DASHBOARD_TEACHER_VIEW_V3',
	}, {
		name: res.$t('global.link.files'),
		testId: 'Meine Dateien',
		icon: 'folder-open-outline',
		link: '/files/',
		excludedPermission: 'COLLABORATIVE_FILES_ONLY',
		children: [
			{
				name: res.$t('global.link.filesPersonal'),
				testId: 'persönliche Dateien',
				icon: 'folder-open-outline',
				link: '/files/my/',
			},
			{
				name: res.$t('global.sidebar.link.administrationCourses'),
				testId: 'Kurse',
				icon: 'folder-open-outline',
				link: '/files/courses/',
			},
			{
				name: res.$t('global.link.filesShared'),
				testId: 'geteilte Dateien',
				icon: 'folder-open-outline',
				link: '/files/shared/',
			},
		],
	},
	{
		name: res.$t('global.headline.files'),
		testId: 'Dateien',
		icon: 'folder-open-outline',
		link: '/cfiles/',
		permission: 'COLLABORATIVE_FILES',
	},
	{
		name: res.$t('global.headline.news'),
		testId: 'Neuigkeiten',
		icon: 'newspaper-variant-outline',
		link: '/news/',
	}, {
		name: res.$t('global.link.calendar'),
		testId: 'Termine',
		icon: 'calendar-outline',
		link: '/calendar/',
	}];

	// Lern-Store Feature Toggle
	if (Configuration.get('FEATURE_LERNSTORE_ENABLED') === true) {
		res.locals.sidebarItems.push({
			name: res.$t('global.link.lernstore'),
			testId: 'Lern-Store',
			icon: // eslint-disable-next-line max-len
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11.9999 22.9806C10.6635 21.7991 9.19644 20.8886 7.59867 20.2493C6.00091 19.6099 4.36906 19.2903 2.70312 19.2903V8.38377C4.35457 8.38377 5.97263 8.72454 7.5573 9.40607C9.14195 10.0876 10.6228 11.0487 11.9999 12.2892C13.3769 11.0487 14.8578 10.0876 16.4425 9.40607C18.0271 8.72454 19.6452 8.38377 21.2966 8.38377V19.2925C19.6329 19.2925 18.0023 19.6118 16.4048 20.2504C14.8074 20.889 13.3391 21.7991 11.9999 22.9806ZM11.9999 20.5751C13.1173 19.7439 14.2863 19.0718 15.5069 18.5588C16.7276 18.0457 17.9973 17.7084 19.3162 17.5468V10.5599C18.2017 10.7055 17.0317 11.1244 15.8064 11.8164C14.581 12.5084 13.3122 13.4726 11.9999 14.7088C10.6124 13.441 9.32947 12.4742 8.15112 11.8085C6.97276 11.1428 5.82162 10.7266 4.6977 10.5599V17.5468C5.97922 17.6964 7.23257 18.0283 8.45775 18.5427C9.68293 19.057 10.8636 19.7345 11.9999 20.5751ZM12.0802 8.70007C10.9556 8.70007 10.006 8.31357 9.2314 7.54055C8.45675 6.76753 8.06943 5.81735 8.06943 4.69C8.06943 3.56265 8.45496 2.61166 9.22602 1.83702C9.99707 1.06237 10.9449 0.675049 12.0695 0.675049C13.1941 0.675049 14.1437 1.06237 14.9184 1.83702C15.693 2.61166 16.0803 3.56265 16.0803 4.69C16.0803 5.81735 15.6948 6.76753 14.9237 7.54055C14.1527 8.31357 13.2048 8.70007 12.0802 8.70007ZM12.0842 6.87505C12.6903 6.87505 13.206 6.66104 13.6314 6.23302C14.0567 5.80501 14.2694 5.28934 14.2694 4.68602C14.2694 4.08269 14.0536 3.56753 13.622 3.14055C13.1904 2.71357 12.6716 2.50007 12.0655 2.50007C11.4594 2.50007 10.9437 2.7149 10.5184 3.14455C10.093 3.57418 9.88032 4.09066 9.88032 4.69397C9.88032 5.29731 10.0961 5.81166 10.5277 6.23702C10.9593 6.66237 11.4782 6.87505 12.0842 6.87505Z"/></svg>',
			isExternalIcon: true,
			link: '/content/',
			permission: 'LERNSTORE_VIEW',
		});
	}

	// Extensions Feature Toggle
	const extensionsEnabled = FEATURE_EXTENSIONS_ENABLED === 'true';
	if (extensionsEnabled) {
		res.locals.sidebarItems.push({
			name: res.$t('global.sidebar.link.addons'),
			testId: 'Add-ons',
			icon: 'puzzle-outline',
			link: '/addons/',
		});
	}

	// teacher views
	res.locals.sidebarItems.push({
		name: res.$t('global.link.management'),
		testId: 'Verwaltung',
		icon: 'cog-outline',
		link: '/administration/',
		permission: 'STUDENT_LIST',
		excludedPermission: 'ADMIN_VIEW',
		children: [
			{
				name: res.$t('global.link.administrationStudents'),
				testId: 'Schüler:innen',
				icon: 'account-school-outline',
				link: '/administration/students/',
			},
			{
				name: res.$t('global.link.managementTeachers'),
				testId: 'Lehrkräfte',
				icon: 'user',
				link: '/administration/teachers/',
			},
			{
				name: res.$t('global.sidebar.link.administrationClasses'),
				testId: 'Klassen',
				icon: 'users',
				link: '/administration/classes/',
			},
		],
	});

	// teacher views
	res.locals.sidebarItems.push({
		name: res.$t('global.link.management'),
		testId: 'Verwaltung',
		icon: 'cog-outline',
		link: '/administration/',
		permission: 'TEACHER_LIST',
		excludedPermission: ['ADMIN_VIEW', 'STUDENT_LIST'],
		children: [
			{
				name: res.$t('global.link.managementTeachers'),
				testId: 'Lehrkräfte',
				icon: 'user',
				link: '/administration/teachers/',
			},
			{
				name: res.$t('global.sidebar.link.administrationClasses'),
				testId: 'Klassen',
				icon: 'users',
				link: '/administration/classes/',
			},
		],
	});

	// admin views
	const newSchoolAdminPageAsDefault = FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED === 'true';
	res.locals.sidebarItems.push({
		name: res.$t('global.link.management'),
		testId: 'Verwaltung',
		icon: 'cog-outline',
		link: '/administration/',
		permission: 'ADMIN_VIEW',
		children: [
			{
				name: res.$t('global.link.administrationStudents'),
				testId: 'Schüler:innen',
				icon: 'account-school-outline',
				link: '/administration/students/',
			},
			{
				name: res.$t('global.link.managementTeachers'),
				testId: 'Lehrkräfte',
				icon: 'user',
				link: '/administration/teachers/',
			},
			{
				name: res.$t('global.sidebar.link.administrationCourses'),
				testId: 'Kurse',
				icon: 'school-outline',
				link: '/administration/courses/',
			},
			{
				name: res.$t('global.sidebar.link.administrationClasses'),
				testId: 'Klassen',
				icon: 'users',
				link: '/administration/classes/',
			},
			{
				name: res.$t('global.link.teams'),
				testId: 'Teams',
				icon: 'account-group-outline',
				link: '/administration/teams/',
			},
			{
				name: res.$t('global.link.school'),
				testId: 'Schule',
				icon: // eslint-disable-next-line max-len
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 21V7.95L15.875 3V12C17.0472 12 21 12 21 12V21H3ZM4.5 19.5H9.25V12H14.375V5.175L4.5 8.975V19.5ZM10.75 19.5H14.375V16.75H15.875V19.5H19.5V13.5H10.75V19.5Z"/></svg>',
				isExternalIcon: true,
				link: newSchoolAdminPageAsDefault
					? '/administration/school-settings/'
					: '/administration/school/',
			},
		],
	});

	// beta user view
	res.locals.sidebarItems.push({
		name: res.$t('global.headline.myMaterial'),
		testId: 'Meine Materialien',
		icon: 'book',
		link: '/my-material/',
		permission: 'BETA_FEATURES',
	});

	// team feature toggle
	const teamsEnabled = FEATURE_TEAMS_ENABLED === 'true';
	if (teamsEnabled) {
		res.locals.sidebarItems.splice(2, 0, {
			name: res.$t('global.link.teams'),
			testId: 'Teams',
			icon: 'account-group-outline',
			link: '/teams/',
		});
		res.locals.sidebarItems.find((i) => i.name === res.$t('global.link.files')).children.splice(2, 0, {
			name: res.$t('global.link.teams'),
			testId: 'Teams',
			icon: 'folder-open-outline',
			link: '/files/teams/',
		});
		/*
				res.locals.sidebarItems.find(i => i.name === 'Administration').children.splice(4, 0, {
						name: 'Teams',
						icon: 'users',
						link: '/administration/teams/',
				});
				*/
	}
	// helpArea view
	res.locals.sidebarItems.push({
		name: res.$t('global.link.helpArea'),
		testId: 'Hilfebereich',
		icon: 'help-circle-outline',
		link: '/help/',
		children: [
			{
				name: res.$t('help.headline.helpSection'),
				testId: 'Hilfeartikel',
				icon: 'file-question-outline',
				link: '/help/articles/',
			},
			{
				name: res.$t('global.link.contact'),
				testId: 'Kontakt',
				icon: 'chat-outline',
				link: '/help/contact/',
			},
			{
				name: res.$t('lib.help_menu.link.training'),
				testId: 'Fortbildungen',
				icon: 'file-certificate-outline',
				link: 'https://lernen.cloud/',
				isExternalLink: true,
			},
		],
	});
	makeActive(res.locals.sidebarItems, url.parse(req.url).pathname);

	let notificationsPromise = [];
	if (NOTIFICATION_SERVICE_ENABLED) {
		notificationsPromise = api(req).get('/notification', {
			qs: {
				$limit: 10,
				$sort: '-createdAt',
			},
		}).catch((_) => []);
	}
	let notificationCount = 0;

	Promise.all([
		notificationsPromise,
	]).then(([notifications]) => {
		res.locals.notifications = (notifications.data || []).map((notification) => {
			const notificationId = notification._id;
			const callbacks = notification.callbacks || [];

			notification = notification.message;
			notification.notificationId = notificationId;

			notification.date = new Date(notification.createdAt); // make new date out of iso string

			notification.read = false;
			callbacks.forEach((callback) => {
				if (callback.type === 'read') notification.read = true;
			});

			if (!notification.read) {
				notificationCount++;
			}

			return notification;
		});
		res.locals.recentNotifications = notificationCount;
		next();
	});
};
