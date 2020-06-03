const url = require('url');
const api = require('../../api');
const {
	PUBLIC_BACKEND_URL,
	FEATURE_EXTENSIONS_ENABLED,
	NOTIFICATION_SERVICE_ENABLED,
	FEATURE_TEAMS_ENABLED,
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

			if (item.children.filter(child => child.class == 'active').length == 0) {
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
		name: res.$t('global.sidebar.link.overview'),
		icon: 'th-large',
		link: '/dashboard/',
	}, {
		name: res.$t('global.sidebar.link.courses'),
		icon: 'graduation-cap',
		link: '/courses/',
	}, {
		name: res.$t('global.sidebar.link.tasks'),
		icon: 'tasks',
		link: '/homework/',
		children: [
			{
				name: res.$t('global.sidebar.link.tasksAsked'),
				icon: 'bullhorn',
				link: '/homework/asked/',
			},
			{
				name: res.$t('global.sidebar.link.tasksDrafts'),
				icon: 'lock',
				link: '/homework/private/',
			},
			{
				name: res.$t('global.sidebar.link.tasksArchive'),
				icon: 'archive',
				link: '/homework/archive/',
			},
		],
	}, {
		name: res.$t('global.sidebar.link.files'),
		icon: 'folder-open',
		link: '/files/',
		children: [
			{
				name: res.$t('global.sidebar.link.filesPersonal'),
				icon: 'folder-open-o',
				link: '/files/my/',
			},
			{
				name: res.$t('global.sidebar.link.filesCourse'),
				icon: 'folder-open-o',
				link: '/files/courses/',
			},
			{
				name: res.$t('global.sidebar.link.filesShared'),
				icon: 'folder-open-o',
				link: '/files/shared/',
			},
		],
	}, {
		name: res.$t('global.sidebar.link.news'),
		icon: 'newspaper-o',
		link: '/news/',
	}, {
		name: res.$t('global.sidebar.link.calendar'),
		icon: 'table',
		link: '/calendar/',
	}, {
		name: res.$t('global.sidebar.link.lernstore'),
		icon: 'search',
		link: '/content/',
	}];

	// Extensions Feature Toggle
	const extensionsEnabled = FEATURE_EXTENSIONS_ENABLED === 'true';
	if (extensionsEnabled) {
		res.locals.sidebarItems.push({
			name: res.$t('global.sidebar.link.archive'),
			icon: 'puzzle-piece',
			link: '/addons',
		});
	}

	// teacher views
	res.locals.sidebarItems.push({
		name: res.$t('global.sidebar.link.management'),
		icon: 'cogs',
		link: '/administration/',
		permission: 'STUDENT_LIST',
		excludedPermission: 'ADMIN_VIEW',
		children: [
			{
				name: res.$t('global.sidebar.link.managementStudents'),
				icon: 'odnoklassniki',
				link: '/administration/students/',
			},
			{
				name: res.$t('global.sidebar.link.managementTeachers'),
				icon: 'user',
				link: '/administration/teachers/',
			},
			{
				name: res.$t('global.sidebar.link.managementClasses'),
				icon: 'users',
				link: '/administration/classes/',
			},
		],
	});

	// helpdesk views
	res.locals.sidebarItems.push({
		name: res.$t('global.sidebar.link.helpDesk'),
		icon: 'ticket',
		link: '/administration/helpdesk/',
		permission: 'HELPDESK_VIEW',
	});

	// admin views
	res.locals.sidebarItems.push({
		name: res.$t('global.sidebar.link.administration'),
		icon: 'cogs',
		link: '/administration/',
		permission: 'ADMIN_VIEW',
		children: [
			{
				name: res.$t('global.sidebar.link.administrationStudents'),
				icon: 'odnoklassniki',
				link: '/administration/students/',
			},
			{
				name: res.$t('global.sidebar.link.administrationTeachers'),
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
				name: res.$t('global.sidebar.link.administrationTeams'),
				icon: 'users',
				link: '/administration/teams/',
			},
			{
				name: res.$t('global.sidebar.link.administrationSchools'),
				icon: 'building',
				link: '/administration/school/',
			},
		],
	});

	// beta user view
	res.locals.sidebarItems.push({
		name: res.$t('global.sidebar.link.myMaterial'),
		icon: 'book',
		link: '/my-material/',
		permission: 'BETA_FEATURES',
	});

	// team feature toggle
	const teamsEnabled = FEATURE_TEAMS_ENABLED === 'true';
	if (teamsEnabled) {
		res.locals.sidebarItems.splice(2, 0, {
			name: res.$t('global.sidebar.link.teams'),
			icon: 'users',
			link: '/teams/',
		});
		res.locals.sidebarItems.find(i => i.name === res.$t('global.sidebar.link.files')).children.splice(2, 0, {
			name: res.$t('global.sidebar.link.teams'),
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

	makeActive(res.locals.sidebarItems, url.parse(req.url).pathname);

	let notificationsPromise = [];
	if (NOTIFICATION_SERVICE_ENABLED) {
		notificationsPromise = api(req).get('/notification', {
			qs: {
				$limit: 10,
				$sort: '-createdAt',
			},
		}).catch(_ => []);
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
