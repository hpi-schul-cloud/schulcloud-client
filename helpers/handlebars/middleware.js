const url = require('url');
const { Configuration } = require('@hpi-schul-cloud/commons');
const api = require('../../api');
const {
	PUBLIC_BACKEND_URL,
	FEATURE_EXTENSIONS_ENABLED,
	NOTIFICATION_SERVICE_ENABLED,
	FEATURE_TEAMS_ENABLED,
	HELPAREA_URL,
} = require('../../config/global');


const makeActive = (items, currentUrl) => {
	currentUrl += '/';
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
		icon: 'th-large',
		link: '/dashboard/',
	}, {
		name: res.$t('global.sidebar.link.administrationCourses'),
		icon: 'graduation-cap',
		link: '/courses/',
	}, {
		name: res.$t('global.headline.tasks'),
		icon: 'tasks',
		link: '/homework/',
		children: [
			{
				name: res.$t('global.headline.assignedTasks'),
				icon: 'bullhorn',
				link: '/homework/asked/',
			},
			{
				name: res.$t('global.link.tasksDrafts'),
				icon: 'lock',
				link: '/homework/private/',
			},
			{
				name: res.$t('global.link.archive'),
				icon: 'archive',
				link: '/homework/archive/',
			},
		],
	}, {
		name: res.$t('global.link.files'),
		icon: 'folder-open',
		link: '/files/',
		children: [
			{
				name: res.$t('global.link.filesPersonal'),
				icon: 'folder-open-o',
				link: '/files/my/',
			},
			{
				name: res.$t('global.sidebar.link.administrationCourses'),
				icon: 'folder-open-o',
				link: '/files/courses/',
			},
			{
				name: res.$t('global.link.filesShared'),
				icon: 'folder-open-o',
				link: '/files/shared/',
			},
		],
	}, {
		name: res.$t('global.headline.news'),
		icon: 'newspaper-o',
		link: '/news/',
	}, {
		name: res.$t('global.link.calendar'),
		icon: 'table',
		link: '/calendar/',
	}];

	// Lern-Store Feature Toggle
	if (Configuration.get('LERNSTORE_MODE') !== 'DISABLED') {
		res.locals.sidebarItems.push({
			name: res.$t('global.link.lernstore'),
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
			icon: 'puzzle-piece',
			link: '/addons/',
		});
	}

	// teacher views
	res.locals.sidebarItems.push({
		name: res.$t('global.link.management'),
		icon: 'cogs',
		link: '/administration/',
		permission: 'STUDENT_LIST',
		excludedPermission: 'ADMIN_VIEW',
		children: [
			{
				name: res.$t('global.link.administrationStudents'),
				icon: 'odnoklassniki',
				link: '/administration/students/',
			},
			{
				name: res.$t('global.link.managementTeachers'),
				icon: 'user',
				link: '/administration/teachers/',
			},
			{
				name: res.$t('global.sidebar.link.administrationClasses'),
				icon: 'users',
				link: '/administration/classes/',
			},
		],
	});

	// teacher views
	res.locals.sidebarItems.push({
		name: res.$t('global.link.management'),
		icon: 'cogs',
		link: '/administration/',
		permission: 'TEACHER_LIST',
		excludedPermission: ['ADMIN_VIEW', 'STUDENT_LIST'],
		children: [
			{
				name: res.$t('global.link.managementTeachers'),
				icon: 'user',
				link: '/administration/teachers/',
			},
			{
				name: res.$t('global.sidebar.link.administrationClasses'),
				icon: 'users',
				link: '/administration/classes/',
			},
		],
	});

	// helpdesk views
	res.locals.sidebarItems.push({
		name: res.$t('global.link.helpDesk'),
		icon: 'ticket',
		link: '/helpdesk/',
		permission: 'HELPDESK_VIEW',
	});

	// admin views
	res.locals.sidebarItems.push({
		name: res.$t('global.link.management'),
		icon: 'cogs',
		link: '/administration/',
		permission: 'ADMIN_VIEW',
		children: [
			{
				name: res.$t('global.link.administrationStudents'),
				icon: 'odnoklassniki',
				link: '/administration/students/',
			},
			{
				name: res.$t('global.link.managementTeachers'),
				icon: 'user',
				link: '/administration/teachers/',
			},
			{
				name: res.$t('global.sidebar.link.administrationCourses'),
				icon: 'graduation-cap',
				link: '/administration/courses/',
			},
			{
				name: res.$t('global.sidebar.link.administrationClasses'),
				icon: 'users',
				link: '/administration/classes/',
			},
			{
				name: res.$t('global.link.teams'),
				icon: 'users',
				link: '/administration/teams/',
			},
			{
				name: res.$t('global.link.school'),
				icon: 'building',
				link: '/administration/school/',
			},
		],
	});

	// beta user view
	res.locals.sidebarItems.push({
		name: res.$t('global.headline.myMaterial'),
		icon: 'book',
		link: '/my-material/',
		permission: 'BETA_FEATURES',
	});

	// team feature toggle
	const teamsEnabled = FEATURE_TEAMS_ENABLED === 'true';
	if (teamsEnabled) {
		res.locals.sidebarItems.splice(2, 0, {
			name: res.$t('global.link.teams'),
			icon: 'users',
			link: '/teams/',
		});
		res.locals.sidebarItems.find((i) => i.name === res.$t('global.link.files')).children.splice(2, 0, {
			name: res.$t('global.link.teams'),
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
	if (HELPAREA_URL) {
		res.locals.sidebarItems.push({
			name: res.$t('global.link.helpArea'),
			icon: 'question-circle',
			link: HELPAREA_URL,
			isExternalLink: true,
		});
	} else {
		res.locals.sidebarItems.push({
			name: res.$t('global.link.helpArea'),
			icon: 'question-circle',
			link: '/help/',
			children: [
				{
					name: res.$t('help.headline.helpSection'),
					icon:
						'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="none" d="M0 0h24v24H0z" /><rect class="cls-2" x="8.9" y="2.6" width="2.1" height="8.4" rx=".5" transform="rotate(-90 9.95 6.8)" /><path d="M16.77 11a5.78 5.78 0 105.78 5.77A5.77 5.77 0 0016.77 11zm.58 9.78H16.2v-1.14h1.15zm1.18-4.44l-.51.53a1.93 1.93 0 00-.67 1.62H16.2v-.29a2.32 2.32 0 01.67-1.62l.71-.72a1.11 1.11 0 00.34-.8 1.15 1.15 0 10-2.29 0h-1.15a2.29 2.29 0 114.58 0 1.78 1.78 0 01-.53 1.28z" /><path d="M9.81 20.45H3.65V3.65h12.6v5.27h.52a7.5 7.5 0 011.58.16V3.65a2.72 2.72 0 000-.42 2.2 2.2 0 00-.23-.59 2.1 2.1 0 00-.6-.69l-.22-.13a2 2 0 00-.59-.23 2 2 0 00-.42 0h-3a1 1 0 00-.17 0H3.65a1.87 1.87 0 00-.42 0 1.91 1.91 0 00-.59.23 2.08 2.08 0 00-.48.34 2.08 2.08 0 00-.34.48 1.91 1.91 0 00-.23.59 1.87 1.87 0 000 .42v16.8a2 2 0 000 .42 2 2 0 00.23.59 2.25 2.25 0 00.34.47 2.12 2.12 0 00.48.35 2.2 2.2 0 00.59.23 2.72 2.72 0 00.42 0h7.78a7.92 7.92 0 01-1.62-2.06z" /><path d="M5.75 10.47v1a.52.52 0 00.52.53h4.21a7.86 7.86 0 012.38-2H6.27a.52.52 0 00-.52.47zm0 4.2v1.05a.52.52 0 00.52.53h2.65a7.7 7.7 0 01.44-2.1H6.27a.52.52 0 00-.52.52z" /></g></svg>',
					link: '/help/articles/',
					isExternalIcon: true,
				},
				{
					name: res.$t('lib.help_menu.link.training'),
					icon:
						'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="17.56" cy="8.77" r="3.63" /><path d="M17.56 14.47a5.59 5.59 0 01-3-.86v7.73a.44.44 0 00.74.28l1-.9 1.29-1.07 1.29 1.07 1 .9a.45.45 0 00.75-.28v-7.77a5.7 5.7 0 01-3.07.9zm0 2.59zM6.27 7.27v.93a.47.47 0 00.46.47h5.14a5.86 5.86 0 01.13-.94 5.84 5.84 0 01.27-.93H6.73a.47.47 0 00-.46.47z" /><path d="M15.71 3.41a4.4 4.4 0 01.62-.18A2.09 2.09 0 0016 3.1a2.43 2.43 0 00-.38 0H4.4a2.43 2.43 0 00-.4 0 2 2 0 00-.52.21 1.79 1.79 0 00-.42.3 2.53 2.53 0 00-.29.39 2 2 0 00-.2.53 2.21 2.21 0 000 .37v14.97a2.21 2.21 0 000 .37 2 2 0 00.2.53 2.53 2.53 0 00.31.42 1.79 1.79 0 00.42.3 2 2 0 00.5.21 2.43 2.43 0 00.38 0h8.28v-1.83H4.4V4.93h9a1 1 0 01.11-.1 5.64 5.64 0 012.2-1.42z" /><path d="M6.73 10.55a.48.48 0 00-.47.47V12a.47.47 0 00.47.46h5.4v-1.95zm0 3.72a.47.47 0 00-.46.46v.94a.47.47 0 00.46.46h5.41v-1.86z" /><path fill="none" d="M0 0h24v24H0z" /></svg>',
					link: 'https://lernen.cloud/',
					isExternalLink: true,
					isExternalIcon: true,
				},
				{
					name: res.$t('global.link.contact'),
					icon: 'comment',
					link: '/help/contact/',
				},
			],
		});
	}
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
