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
				icon: // eslint-disable-next-line max-len
				'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M21.7936 18.8849C21.4332 17.9592 20.6641 17.3277 20 16.9455V15V8H4V18H10.7284C10.3063 18.5176 10 19.1787 10 20H4C3.46957 20 2.96086 19.7893 2.58579 19.4142C2.21071 19.0391 2 18.5304 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V18C22 18.3098 21.9281 18.6122 21.7936 18.8849ZM17.4142 13.5858C17.0391 13.2107 16.5304 13 16 13C15.4696 13 14.9609 13.2107 14.5858 13.5858C14.2107 13.9609 14 14.4696 14 15C14 15.5304 14.2107 16.0391 14.5858 16.4142C14.9609 16.7893 15.4696 17 16 17C16.5304 17 17.0391 16.7893 17.4142 16.4142C17.7893 16.0391 18 15.5304 18 15C18 14.4696 17.7893 13.9609 17.4142 13.5858ZM20 20C20 18.895 18.21 18 16 18C13.79 18 12 18.895 12 20V21H20V20Z" fill="#54616E"/></svg>',
				isExternalIcon: true,
				link: '/files/my/',
			},
			{
				name: res.$t('global.sidebar.link.administrationCourses'),
				testId: 'Kurse',
				icon: // eslint-disable-next-line max-len
				'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.48242 18H11.4824C11.4824 18.695 11.5837 19.3663 11.7723 20H4.48242C3.95199 20 3.44328 19.7893 3.06821 19.4142C2.69314 19.0391 2.48242 18.5304 2.48242 18V6C2.48242 4.89 3.37242 4 4.48242 4H10.4824L12.4824 6H20.4824C21.5824 6 22.4824 6.89 22.4824 8V12.2547C21.8784 11.8334 21.2049 11.5049 20.4824 11.2899V8H4.48242V18ZM12.9824 16.5L18.4824 13.5L23.9824 16.5V20.5H22.9824V17.045L18.4824 19.5L12.9824 16.5ZM14.9824 20.59V18.59L18.4824 20.5L21.9824 18.59V20.59L18.4824 22.5L14.9824 20.59Z" fill="#54616E"/></svg>',
				isExternalIcon: true,
				link: '/files/courses/',
			},
			{
				name: res.$t('global.link.filesShared'),
				testId: 'geteilte Dateien',
				icon: // eslint-disable-next-line max-len
				'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.4393 19.0607C14.158 18.7794 14 18.3978 14 18C14 17.6022 14.158 17.2206 14.4393 16.9393C14.7206 16.658 15.1022 16.5 15.5 16.5C15.895 16.5 16.25 16.655 16.52 16.905L20 14.8762L20.045 14.85C20.0449 14.8494 20.0447 14.8488 20.0446 14.8481C20.0198 14.7338 20 14.6194 20 14.5C20 14.1022 20.158 13.7206 20.4393 13.4393C20.548 13.3307 20.6716 13.2404 20.8053 13.1705C21.0178 13.0595 21.2558 13 21.5 13C21.672 13 21.8409 13.0295 22 13.0858C22.209 13.1597 22.401 13.2796 22.5607 13.4393C22.842 13.7206 23 14.1022 23 14.5C23 14.8978 22.842 15.2794 22.5607 15.5607C22.401 15.7204 22.209 15.8403 22 15.9142C21.8409 15.9705 21.672 16 21.5 16C21.4753 16 21.4508 15.9994 21.4264 15.9982C21.4036 15.9971 21.3809 15.9954 21.3583 15.9933C21.0202 15.9611 20.7168 15.815 20.4795 15.5953L20 15.8748L16.955 17.65C16.98 17.765 17 17.88 17 18C17 18.1193 16.9802 18.2336 16.9555 18.3479C16.9553 18.3486 16.9552 18.3493 16.955 18.35L19.7898 20L20.52 20.425C20.78 20.19 21.12 20.04 21.5 20.04C21.8872 20.04 22.2586 20.1938 22.5324 20.4676C22.8062 20.7414 22.96 21.1128 22.96 21.5C22.96 22.305 22.305 22.955 21.5 22.955C20.695 22.955 20.04 22.305 20.04 21.5C20.04 21.385 20.055 21.275 20.08 21.17L18.0727 20L16.52 19.095C16.4215 19.1862 16.3117 19.2647 16.1928 19.3277C15.9857 19.4375 15.7509 19.5 15.5 19.5C15.2176 19.5 14.9435 19.4204 14.7075 19.2736C14.611 19.2135 14.521 19.1423 14.4393 19.0607ZM22 8V11.0359C21.8354 11.0121 21.6683 11 21.5 11C20.9762 11 20.4644 11.1174 20 11.3377V8H4V18H12C12 18.72 12.2219 19.4171 12.6277 20H4C3.46957 20 2.96086 19.7893 2.58579 19.4142C2.21071 19.0391 2 18.5304 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8Z" fill="#54616E"/></svg>',
				isExternalIcon: true,
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
			icon: // eslint-disable-next-line max-len
			'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 18H10.2308C10.243 18.0318 10.2556 18.0635 10.2687 18.0949C9.75581 18.4912 9.20115 19.1201 9.0438 20H4C3.46957 20 2.96086 19.7893 2.58579 19.4142C2.21071 19.0391 2 18.5304 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V13.5877C21.5356 13.3674 21.0238 13.25 20.5 13.25C20.331 13.25 20.164 13.262 20 13.2855V8H4V18ZM18.2374 14.2626C17.9092 13.9344 17.4641 13.75 17 13.75C16.5359 13.75 16.0908 13.9344 15.7626 14.2626C15.4344 14.5908 15.25 15.0359 15.25 15.5C15.25 15.9641 15.4344 16.4092 15.7626 16.7374C16.0908 17.0656 16.5359 17.25 17 17.25C17.4641 17.25 17.9092 17.0656 18.2374 16.7374C18.5656 16.4092 18.75 15.9641 18.75 15.5C18.75 15.0359 18.5656 14.5908 18.2374 14.2626ZM14.265 15.21C14.04 15.075 13.78 15 13.5 15C13.1022 15 12.7206 15.158 12.4393 15.4393C12.158 15.7206 12 16.1022 12 16.5C12 16.8978 12.158 17.2794 12.4393 17.5607C12.7206 17.842 13.1022 18 13.5 18C14.08 18 14.58 17.67 14.83 17.19C14.4 16.635 14.19 15.925 14.265 15.21ZM21.5607 15.4393C21.2794 15.158 20.8978 15 20.5 15C20.22 15 19.96 15.075 19.735 15.21C19.81 15.925 19.6 16.635 19.17 17.19C19.42 17.67 19.92 18 20.5 18C20.8978 18 21.2794 17.842 21.5607 17.5607C21.842 17.2794 22 16.8978 22 16.5C22 16.1022 21.842 15.7206 21.5607 15.4393ZM17 18.25C15.205 18.25 13.75 19.09 13.75 20.125V21H20.25V20.125C20.25 19.09 18.795 18.25 17 18.25ZM11 20.25V21H12.75V20.125C12.75 19.61 12.93 19.14 13.225 18.8C11.945 18.97 11 19.555 11 20.25ZM21.25 21H23V20.25C23 19.555 22.055 18.97 20.775 18.8C21.07 19.14 21.25 19.61 21.25 20.125V21Z" fill="#54616E"/></svg>',
			isExternalIcon: true,
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
