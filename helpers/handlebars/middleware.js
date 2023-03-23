const url = require('url');
const { Configuration } = require('@hpi-schul-cloud/commons');
const api = require('../../api');
const {
	PUBLIC_BACKEND_URL,
	FEATURE_EXTENSIONS_ENABLED,
	NOTIFICATION_SERVICE_ENABLED,
	FEATURE_TEAMS_ENABLED,
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
		icon: 'th-large',
		link: '/dashboard/',
	},
	{
		name: res.$t('global.sidebar.link.administrationCourses'),
		testId: 'Course-Overview',
		icon: 'graduation-cap',
		link: '/rooms-overview/',
	}, {
		name: res.$t('global.headline.tasks'),
		testId: 'Aufgaben',
		icon:
			// eslint-disable-next-line max-len
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M10.382 13.295c.39.39.39 1.02 0 1.4l-4.588 4.588a1 1 0 01-1.414 0l-2.088-2.088a.984.984 0 010-1.4 1 1 0 011.412-.002l1.383 1.377 3.884-3.876a1 1 0 011.411.001zM21 15a1 1 0 110 2h-8a1 1 0 110-2h8zM8 5a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1h4zM7 7H5v2h2V7zm14 0a1 1 0 110 2h-8a1 1 0 110-2h8z"/></svg>',
		isExternalIcon: true,
		link: '/tasks',
		permission: 'TASK_DASHBOARD_VIEW_V3',
	}, {
		name: res.$t('global.headline.tasks'),
		testId: 'Aufgaben',
		icon:
			// eslint-disable-next-line max-len
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M10.382 13.295c.39.39.39 1.02 0 1.4l-4.588 4.588a1 1 0 01-1.414 0l-2.088-2.088a.984.984 0 010-1.4 1 1 0 011.412-.002l1.383 1.377 3.884-3.876a1 1 0 011.411.001zM21 15a1 1 0 110 2h-8a1 1 0 110-2h8zM8 5a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1h4zM7 7H5v2h2V7zm14 0a1 1 0 110 2h-8a1 1 0 110-2h8z"/></svg>',
		isExternalIcon: true,
		link: '/tasks',
		permission: 'TASK_DASHBOARD_TEACHER_VIEW_V3',
	}, {
		name: res.$t('global.link.files'),
		testId: 'Meine Dateien',
		icon: 'folder-open',
		link: '/files/',
		excludedPermission: 'COLLABORATIVE_FILES_ONLY',
		children: [
			{
				name: res.$t('global.link.filesPersonal'),
				testId: 'persönliche Dateien',
				icon: 'folder-open-o',
				link: '/files/my/',
			},
			{
				name: res.$t('global.sidebar.link.administrationCourses'),
				testId: 'Kurse',
				icon: 'folder-open-o',
				link: '/files/courses/',
			},
			{
				name: res.$t('global.link.filesShared'),
				testId: 'geteilte Dateien',
				icon: 'folder-open-o',
				link: '/files/shared/',
			},
		],
	},
	{
		name: res.$t('global.headline.files'),
		testId: 'Dateien',
		icon: 'folder-open',
		link: '/cfiles/',
		permission: 'COLLABORATIVE_FILES',
	},
	{
		name: res.$t('global.headline.news'),
		testId: 'Neuigkeiten',
		icon: 'newspaper-o',
		link: '/news/',
	}, {
		name: res.$t('global.link.calendar'),
		testId: 'Termine',
		icon: 'table',
		link: '/calendar/',
	}];

	// Lern-Store Feature Toggle
	if (Configuration.get('FEATURE_LERNSTORE_ENABLED') === true) {
		res.locals.sidebarItems.push({
			name: res.$t('global.link.lernstore'),
			testId: 'Lern-Store',
			icon: 'search',
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
			icon: 'puzzle-piece',
			link: '/addons/',
		});
	}

	// teacher views
	res.locals.sidebarItems.push({
		name: res.$t('global.link.management'),
		testId: 'Verwaltung',
		icon: 'cogs',
		link: '/administration/',
		permission: 'STUDENT_LIST',
		excludedPermission: 'ADMIN_VIEW',
		children: [
			{
				name: res.$t('global.link.administrationStudents'),
				testId: 'Schüler:innen',
				icon: 'odnoklassniki',
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
		icon: 'cogs',
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
	res.locals.sidebarItems.push({
		name: res.$t('global.link.management'),
		testId: 'Verwaltung',
		icon: 'cogs',
		link: '/administration/',
		permission: 'ADMIN_VIEW',
		children: [
			{
				name: res.$t('global.link.administrationStudents'),
				testId: 'Schüler:innen',
				icon: 'odnoklassniki',
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
				icon: 'graduation-cap',
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
				icon: 'users',
				link: '/administration/teams/',
			},
			{
				name: res.$t('global.link.school'),
				testId: 'Schule',
				icon: 'building',
				link: '/administration/school/',
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
			icon: 'users',
			link: '/teams/',
		});
		res.locals.sidebarItems.find((i) => i.name === res.$t('global.link.files')).children.splice(2, 0, {
			name: res.$t('global.link.teams'),
			testId: 'Teams',
			icon: 'folder-open-o',
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
		icon: 'question-circle',
		link: '/help/',
		children: [
			{
				name: res.$t('help.headline.helpSection'),
				testId: 'Hilfeartikel',
				icon:
					// eslint-disable-next-line max-len
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2M18 20H6V4H13V9H18V20M15 13C15 14.89 12.75 15.07 12.75 16.76H11.25C11.25 14.32 13.5 14.5 13.5 13C13.5 12.18 12.83 11.5 12 11.5S10.5 12.18 10.5 13H9C9 11.35 10.34 10 12 10S15 11.35 15 13M12.75 17.5V19H11.25V17.5H12.75Z" /></svg>',
				link: '/help/articles/',
				isExternalIcon: true,
			},
			{
				name: res.$t('global.link.contact'),
				testId: 'Kontakt',
				icon: 'comment-o',
				link: '/help/contact/',
			},
			{
				name: res.$t('lib.help_menu.link.training'),
				testId: 'Fortbildungen',
				icon:
					// eslint-disable-next-line max-len
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 13V11L12 12L10 11V13L8 14L10 15V17L12 16L14 17V15L16 14M14 2H7A2 2 0 0 0 5 4V18A2 2 0 0 0 7 20H8V18H7V4H13V8H17V18H16V20H17A2 2 0 0 0 19 18V7M14 13V11L12 12L10 11V13L8 14L10 15V17L12 16L14 17V15L16 14M10 23L12 22L14 23V18H10M14 13V11L12 12L10 11V13L8 14L10 15V17L12 16L14 17V15L16 14Z" /></svg>',
				link: 'https://lernen.cloud/',
				isExternalLink: true,
				isExternalIcon: true,
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
