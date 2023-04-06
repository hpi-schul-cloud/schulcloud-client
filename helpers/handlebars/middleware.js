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
				icon: 'building',
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
