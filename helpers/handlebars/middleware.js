const url = require('url');
const { Configuration } = require('@hpi-schul-cloud/commons');
const api = require('../../api');
const {
	PUBLIC_BACKEND_URL,
	FEATURE_EXTENSIONS_ENABLED,
	NOTIFICATION_SERVICE_ENABLED,
	FEATURE_TEAMS_ENABLED,
	ALERT_STATUS_URL,
	SC_THEME,
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

			if (item.children.filter((child) => child.class === 'active').length === 0) {
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
		testId: 'Dateien',
		icon: 'folder-open-outline',
		link: '/files/',
		excludedPermission: 'COLLABORATIVE_FILES_ONLY',
		groupName: 'files',
		children: [
			{
				name: res.$t('global.link.filesPersonal'),
				testId: 'persönliche Dateien',
				icon: // eslint-disable-next-line max-len
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M21.7936 18.8849C21.4332 17.9592 20.6641 17.3277 20 16.9455V15V8H4V18H10.7284C10.3063 18.5176 10 19.1787 10 20H4C3.46957 20 2.96086 19.7893 2.58579 19.4142C2.21071 19.0391 2 18.5304 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V18C22 18.3098 21.9281 18.6122 21.7936 18.8849ZM17.4142 13.5858C17.0391 13.2107 16.5304 13 16 13C15.4696 13 14.9609 13.2107 14.5858 13.5858C14.2107 13.9609 14 14.4696 14 15C14 15.5304 14.2107 16.0391 14.5858 16.4142C14.9609 16.7893 15.4696 17 16 17C16.5304 17 17.0391 16.7893 17.4142 16.4142C17.7893 16.0391 18 15.5304 18 15C18 14.4696 17.7893 13.9609 17.4142 13.5858ZM20 20C20 18.895 18.21 18 16 18C13.79 18 12 18.895 12 20V21H20V20Z"/></svg>',
				isExternalIcon: true,
				link: '/files/my/',
			},
			{
				name: res.$t('global.sidebar.link.administrationCourses'),
				testId: 'Kurse',
				icon: // eslint-disable-next-line max-len
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 18H11C11 18.695 11.1013 19.3663 11.2899 20H4C3.46957 20 2.96086 19.7893 2.58579 19.4142C2.21071 19.0391 2 18.5304 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V12.2547C21.396 11.8334 20.7224 11.5049 20 11.2899V8H4V18ZM12.5 16.5L18 13.5L23.5 16.5V20.5H22.5V17.045L18 19.5L12.5 16.5ZM14.5 20.59V18.59L18 20.5L21.5 18.59V20.59L18 22.5L14.5 20.59Z"/></svg>',
				isExternalIcon: true,
				link: '/files/courses/',
			},
			{
				name: res.$t('global.link.filesShared'),
				testId: 'geteilte Dateien',
				icon: // eslint-disable-next-line max-len
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M22 11.0359V8C22 6.89 21.1 6 20 6H12L10 4H4C2.89 4 2 4.89 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H12.6277C12.2219 19.4171 12 18.72 12 18H4V8H20V11.3377C20.4644 11.1174 20.9762 11 21.5 11C21.6683 11 21.8354 11.0121 22 11.0359ZM20.52 20.425C20.78 20.19 21.12 20.04 21.5 20.04C21.8872 20.04 22.2586 20.1938 22.5324 20.4676C22.8062 20.7414 22.96 21.1128 22.96 21.5C22.96 22.305 22.305 22.955 21.5 22.955C20.695 22.955 20.04 22.305 20.04 21.5C20.04 21.385 20.055 21.275 20.08 21.17L16.52 19.095C16.25 19.345 15.895 19.5 15.5 19.5C15.1022 19.5 14.7206 19.342 14.4393 19.0607C14.158 18.7794 14 18.3978 14 18C14 17.6022 14.158 17.2206 14.4393 16.9393C14.7206 16.658 15.1022 16.5 15.5 16.5C15.895 16.5 16.25 16.655 16.52 16.905L20.045 14.85C20.02 14.735 20 14.62 20 14.5C20 14.1022 20.158 13.7206 20.4393 13.4393C20.7206 13.158 21.1022 13 21.5 13C21.8978 13 22.2794 13.158 22.5607 13.4393C22.842 13.7206 23 14.1022 23 14.5C23 14.8978 22.842 15.2794 22.5607 15.5607C22.2794 15.842 21.8978 16 21.5 16C21.105 16 20.75 15.845 20.48 15.595L16.955 17.65C16.98 17.765 17 17.88 17 18C17 18.12 16.98 18.235 16.955 18.35L20.52 20.425Z"/></svg>',
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
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path fill="currentColor" d="M11.9999 22.9806C10.6635 21.7991 9.19644 20.8886 7.59867 20.2493C6.00091 19.6099 4.36906 19.2903 2.70312 19.2903V8.38377C4.35457 8.38377 5.97263 8.72454 7.5573 9.40607C9.14195 10.0876 10.6228 11.0487 11.9999 12.2892C13.3769 11.0487 14.8578 10.0876 16.4425 9.40607C18.0271 8.72454 19.6452 8.38377 21.2966 8.38377V19.2925C19.6329 19.2925 18.0023 19.6118 16.4048 20.2504C14.8074 20.889 13.3391 21.7991 11.9999 22.9806ZM11.9999 20.5751C13.1173 19.7439 14.2863 19.0718 15.5069 18.5588C16.7276 18.0457 17.9973 17.7084 19.3162 17.5468V10.5599C18.2017 10.7055 17.0317 11.1244 15.8064 11.8164C14.581 12.5084 13.3122 13.4726 11.9999 14.7088C10.6124 13.441 9.32947 12.4742 8.15112 11.8085C6.97276 11.1428 5.82162 10.7266 4.6977 10.5599V17.5468C5.97922 17.6964 7.23257 18.0283 8.45775 18.5427C9.68293 19.057 10.8636 19.7345 11.9999 20.5751ZM12.0802 8.70007C10.9556 8.70007 10.006 8.31357 9.2314 7.54055C8.45675 6.76753 8.06943 5.81735 8.06943 4.69C8.06943 3.56265 8.45496 2.61166 9.22602 1.83702C9.99707 1.06237 10.9449 0.675049 12.0695 0.675049C13.1941 0.675049 14.1437 1.06237 14.9184 1.83702C15.693 2.61166 16.0803 3.56265 16.0803 4.69C16.0803 5.81735 15.6948 6.76753 14.9237 7.54055C14.1527 8.31357 13.2048 8.70007 12.0802 8.70007ZM12.0842 6.87505C12.6903 6.87505 13.206 6.66104 13.6314 6.23302C14.0567 5.80501 14.2694 5.28934 14.2694 4.68602C14.2694 4.08269 14.0536 3.56753 13.622 3.14055C13.1904 2.71357 12.6716 2.50007 12.0655 2.50007C11.4594 2.50007 10.9437 2.7149 10.5184 3.14455C10.093 3.57418 9.88032 4.09066 9.88032 4.69397C9.88032 5.29731 10.0961 5.81166 10.5277 6.23702C10.9593 6.66237 11.4782 6.87505 12.0842 6.87505Z"/></svg>',
			isExternalIcon: true,
			link: '/content/',
			permission: 'LERNSTORE_VIEW',
		});
	}

	// Media shelf Feature Toggle
	const mediaShelfEnabled = Configuration.get('FEATURE_MEDIA_SHELF_ENABLED');
	if (mediaShelfEnabled) {
		res.locals.sidebarItems.push({
			name: res.$t('global.sidebar.link.mediaShelf'),
			testId: 'Media-shelf',
			icon: 'bookshelf',
			link: '/media-shelf/',
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
	const newClassViewEnabled = Configuration.get('FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED');
	const teacherChildren = [
		{
			name: res.$t('global.link.administrationStudents'),
			testId: 'Schüler:innen',
			icon: 'account-school-outline',
			link: '/administration/students/',
		},
		{
			name: res.$t('global.link.managementTeachers'),
			testId: 'Lehrkräfte',
			icon: // eslint-disable-next-line max-len
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 17C20.5304 17 21.0391 16.7893 21.4142 16.4142C21.7893 16.0391 22 15.5304 22 15V4C22 3.46957 21.7893 2.96086 21.4142 2.58579C21.0391 2.21071 20.5304 2 20 2H9.46C9.81 2.61 10 3.3 10 4H20V15H11V17M15 9V11L9 9V22H7V16H5V22H3V14H1.5V9C1.5 8.46957 1.71071 7.96086 2.08579 7.58579C2.46086 7.21071 2.96957 7 3.5 7H9L15 9ZM8 4C8 4.53043 7.78929 5.03914 7.41421 5.41421C7.03914 5.78929 6.53043 6 6 6C5.46957 6 4.96086 5.78929 4.58579 5.41421C4.21071 5.03914 4 4.53043 4 4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2C6.53043 2 7.03914 2.21071 7.41421 2.58579C7.78929 2.96086 8 3.46957 8 4Z"/></svg>',
			isExternalIcon: true,
			link: '/administration/teachers/',
		},
		{
			name: res.$t('global.sidebar.link.administrationClasses'),
			testId: 'Klassen',
			icon: // eslint-disable-next-line max-len
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 4H20V15.1648C20.7778 15.62 21.3824 16.1788 21.8399 16.7855C21.9429 16.5443 22 16.2788 22 16V4C22 2.89543 21.1046 2 20 2H4C2.89543 2 2 2.89543 2 4V16C2 16.6043 2.26802 17.146 2.69168 17.5128C2.81915 17.279 2.97043 17.0394 3.15 16.8C3.39346 16.4754 3.67575 16.1677 4 15.8832V4ZM11.6667 12.4944C11.1734 12.8241 10.5933 13 10 13C9.20435 13 8.44129 12.6839 7.87868 12.1213C7.31607 11.5587 7 10.7957 7 10C7 9.40666 7.17595 8.82664 7.50559 8.33329C7.83524 7.83994 8.30377 7.45543 8.85195 7.22836C9.40013 7.0013 10.0033 6.94189 10.5853 7.05765C11.1672 7.1734 11.7018 7.45912 12.1213 7.87868C12.5409 8.29824 12.8266 8.83279 12.9424 9.41473C13.0581 9.99667 12.9987 10.5999 12.7716 11.1481C12.5446 11.6962 12.1601 12.1648 11.6667 12.4944ZM10.5556 9.16853C10.3911 9.05865 10.1978 9 10 9C9.73478 9 9.48043 9.10536 9.29289 9.29289C9.10536 9.48043 9 9.73478 9 10C9 10.1978 9.05865 10.3911 9.16853 10.5556C9.27841 10.72 9.43459 10.8482 9.61732 10.9239C9.80004 10.9996 10.0011 11.0194 10.1951 10.9808C10.3891 10.9422 10.5673 10.847 10.7071 10.7071C10.847 10.5673 10.9422 10.3891 10.9808 10.1951C11.0194 10.0011 10.9996 9.80004 10.9239 9.61732C10.8482 9.43459 10.72 9.27841 10.5556 9.16853ZM15.0087 10C15.0087 11.0228 14.6951 12.021 14.11 12.86C14.3976 12.9526 14.6979 12.9998 15 13C15.7956 13 16.5587 12.6839 17.1213 12.1213C17.6839 11.5587 18 10.7957 18 10C18 9.20435 17.6839 8.44129 17.1213 7.87868C16.5587 7.31607 15.7956 7 15 7C14.6979 7.00018 14.3976 7.04741 14.11 7.14C14.6951 7.97897 15.0087 8.97718 15.0087 10ZM4 19C4 19 4 15 10 15C16 15 16 19 16 19V21H4V19ZM10 17C6.32 17 6 18.71 6 19H14C13.94 18.56 13.5 17 10 17ZM21 21V19C21 19 21 15.55 16.2 15.06C16.7466 15.5643 17.1873 16.1724 17.4964 16.8489C17.8054 17.5254 17.9766 18.2566 18 19V21H21Z"/></svg>',
			isExternalIcon: true,
			link: '/administration/classes/',
		},
	];

	// teacher views
	const teacherChildrenWithoutStudents = [
		{
			name: res.$t('global.link.managementTeachers'),
			testId: 'Lehrkräfte',
			icon: // eslint-disable-next-line max-len
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 17C20.5304 17 21.0391 16.7893 21.4142 16.4142C21.7893 16.0391 22 15.5304 22 15V4C22 3.46957 21.7893 2.96086 21.4142 2.58579C21.0391 2.21071 20.5304 2 20 2H9.46C9.81 2.61 10 3.3 10 4H20V15H11V17M15 9V11L9 9V22H7V16H5V22H3V14H1.5V9C1.5 8.46957 1.71071 7.96086 2.08579 7.58579C2.46086 7.21071 2.96957 7 3.5 7H9L15 9ZM8 4C8 4.53043 7.78929 5.03914 7.41421 5.41421C7.03914 5.78929 6.53043 6 6 6C5.46957 6 4.96086 5.78929 4.58579 5.41421C4.21071 5.03914 4 4.53043 4 4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2C6.53043 2 7.03914 2.21071 7.41421 2.58579C7.78929 2.96086 8 3.46957 8 4Z"/></svg>',
			isExternalIcon: true,
			link: '/administration/teachers/',
		},
		{
			name: res.$t('global.sidebar.link.administrationClasses'),
			testId: 'Klassen',
			icon: // eslint-disable-next-line max-len
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 4H20V15.1648C20.7778 15.62 21.3824 16.1788 21.8399 16.7855C21.9429 16.5443 22 16.2788 22 16V4C22 2.89543 21.1046 2 20 2H4C2.89543 2 2 2.89543 2 4V16C2 16.6043 2.26802 17.146 2.69168 17.5128C2.81915 17.279 2.97043 17.0394 3.15 16.8C3.39346 16.4754 3.67575 16.1677 4 15.8832V4ZM11.6667 12.4944C11.1734 12.8241 10.5933 13 10 13C9.20435 13 8.44129 12.6839 7.87868 12.1213C7.31607 11.5587 7 10.7957 7 10C7 9.40666 7.17595 8.82664 7.50559 8.33329C7.83524 7.83994 8.30377 7.45543 8.85195 7.22836C9.40013 7.0013 10.0033 6.94189 10.5853 7.05765C11.1672 7.1734 11.7018 7.45912 12.1213 7.87868C12.5409 8.29824 12.8266 8.83279 12.9424 9.41473C13.0581 9.99667 12.9987 10.5999 12.7716 11.1481C12.5446 11.6962 12.1601 12.1648 11.6667 12.4944ZM10.5556 9.16853C10.3911 9.05865 10.1978 9 10 9C9.73478 9 9.48043 9.10536 9.29289 9.29289C9.10536 9.48043 9 9.73478 9 10C9 10.1978 9.05865 10.3911 9.16853 10.5556C9.27841 10.72 9.43459 10.8482 9.61732 10.9239C9.80004 10.9996 10.0011 11.0194 10.1951 10.9808C10.3891 10.9422 10.5673 10.847 10.7071 10.7071C10.847 10.5673 10.9422 10.3891 10.9808 10.1951C11.0194 10.0011 10.9996 9.80004 10.9239 9.61732C10.8482 9.43459 10.72 9.27841 10.5556 9.16853ZM15.0087 10C15.0087 11.0228 14.6951 12.021 14.11 12.86C14.3976 12.9526 14.6979 12.9998 15 13C15.7956 13 16.5587 12.6839 17.1213 12.1213C17.6839 11.5587 18 10.7957 18 10C18 9.20435 17.6839 8.44129 17.1213 7.87868C16.5587 7.31607 15.7956 7 15 7C14.6979 7.00018 14.3976 7.04741 14.11 7.14C14.6951 7.97897 15.0087 8.97718 15.0087 10ZM4 19C4 19 4 15 10 15C16 15 16 19 16 19V21H4V19ZM10 17C6.32 17 6 18.71 6 19H14C13.94 18.56 13.5 17 10 17ZM21 21V19C21 19 21 15.55 16.2 15.06C16.7466 15.5643 17.1873 16.1724 17.4964 16.8489C17.8054 17.5254 17.9766 18.2566 18 19V21H21Z"/></svg>',
			isExternalIcon: true,
			link: '/administration/classes/',
		},
	];

	if (newClassViewEnabled) {
		teacherChildren.splice(2, 1, {
			name: res.$t('global.sidebar.link.administrationClasses'),
			testId: 'Klassen',
			icon: // eslint-disable-next-line max-len
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 4H20V15.1648C20.7778 15.62 21.3824 16.1788 21.8399 16.7855C21.9429 16.5443 22 16.2788 22 16V4C22 2.89543 21.1046 2 20 2H4C2.89543 2 2 2.89543 2 4V16C2 16.6043 2.26802 17.146 2.69168 17.5128C2.81915 17.279 2.97043 17.0394 3.15 16.8C3.39346 16.4754 3.67575 16.1677 4 15.8832V4ZM11.6667 12.4944C11.1734 12.8241 10.5933 13 10 13C9.20435 13 8.44129 12.6839 7.87868 12.1213C7.31607 11.5587 7 10.7957 7 10C7 9.40666 7.17595 8.82664 7.50559 8.33329C7.83524 7.83994 8.30377 7.45543 8.85195 7.22836C9.40013 7.0013 10.0033 6.94189 10.5853 7.05765C11.1672 7.1734 11.7018 7.45912 12.1213 7.87868C12.5409 8.29824 12.8266 8.83279 12.9424 9.41473C13.0581 9.99667 12.9987 10.5999 12.7716 11.1481C12.5446 11.6962 12.1601 12.1648 11.6667 12.4944ZM10.5556 9.16853C10.3911 9.05865 10.1978 9 10 9C9.73478 9 9.48043 9.10536 9.29289 9.29289C9.10536 9.48043 9 9.73478 9 10C9 10.1978 9.05865 10.3911 9.16853 10.5556C9.27841 10.72 9.43459 10.8482 9.61732 10.9239C9.80004 10.9996 10.0011 11.0194 10.1951 10.9808C10.3891 10.9422 10.5673 10.847 10.7071 10.7071C10.847 10.5673 10.9422 10.3891 10.9808 10.1951C11.0194 10.0011 10.9996 9.80004 10.9239 9.61732C10.8482 9.43459 10.72 9.27841 10.5556 9.16853ZM15.0087 10C15.0087 11.0228 14.6951 12.021 14.11 12.86C14.3976 12.9526 14.6979 12.9998 15 13C15.7956 13 16.5587 12.6839 17.1213 12.1213C17.6839 11.5587 18 10.7957 18 10C18 9.20435 17.6839 8.44129 17.1213 7.87868C16.5587 7.31607 15.7956 7 15 7C14.6979 7.00018 14.3976 7.04741 14.11 7.14C14.6951 7.97897 15.0087 8.97718 15.0087 10ZM4 19C4 19 4 15 10 15C16 15 16 19 16 19V21H4V19ZM10 17C6.32 17 6 18.71 6 19H14C13.94 18.56 13.5 17 10 17ZM21 21V19C21 19 21 15.55 16.2 15.06C16.7466 15.5643 17.1873 16.1724 17.4964 16.8489C17.8054 17.5254 17.9766 18.2566 18 19V21H21Z"/></svg>',
			isExternalIcon: true,
			link: '/administration/groups/classes',
		});

		teacherChildrenWithoutStudents.splice(1, 1, {
			name: res.$t('global.sidebar.link.administrationClasses'),
			testId: 'Klassen',
			icon: // eslint-disable-next-line max-len
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 4H20V15.1648C20.7778 15.62 21.3824 16.1788 21.8399 16.7855C21.9429 16.5443 22 16.2788 22 16V4C22 2.89543 21.1046 2 20 2H4C2.89543 2 2 2.89543 2 4V16C2 16.6043 2.26802 17.146 2.69168 17.5128C2.81915 17.279 2.97043 17.0394 3.15 16.8C3.39346 16.4754 3.67575 16.1677 4 15.8832V4ZM11.6667 12.4944C11.1734 12.8241 10.5933 13 10 13C9.20435 13 8.44129 12.6839 7.87868 12.1213C7.31607 11.5587 7 10.7957 7 10C7 9.40666 7.17595 8.82664 7.50559 8.33329C7.83524 7.83994 8.30377 7.45543 8.85195 7.22836C9.40013 7.0013 10.0033 6.94189 10.5853 7.05765C11.1672 7.1734 11.7018 7.45912 12.1213 7.87868C12.5409 8.29824 12.8266 8.83279 12.9424 9.41473C13.0581 9.99667 12.9987 10.5999 12.7716 11.1481C12.5446 11.6962 12.1601 12.1648 11.6667 12.4944ZM10.5556 9.16853C10.3911 9.05865 10.1978 9 10 9C9.73478 9 9.48043 9.10536 9.29289 9.29289C9.10536 9.48043 9 9.73478 9 10C9 10.1978 9.05865 10.3911 9.16853 10.5556C9.27841 10.72 9.43459 10.8482 9.61732 10.9239C9.80004 10.9996 10.0011 11.0194 10.1951 10.9808C10.3891 10.9422 10.5673 10.847 10.7071 10.7071C10.847 10.5673 10.9422 10.3891 10.9808 10.1951C11.0194 10.0011 10.9996 9.80004 10.9239 9.61732C10.8482 9.43459 10.72 9.27841 10.5556 9.16853ZM15.0087 10C15.0087 11.0228 14.6951 12.021 14.11 12.86C14.3976 12.9526 14.6979 12.9998 15 13C15.7956 13 16.5587 12.6839 17.1213 12.1213C17.6839 11.5587 18 10.7957 18 10C18 9.20435 17.6839 8.44129 17.1213 7.87868C16.5587 7.31607 15.7956 7 15 7C14.6979 7.00018 14.3976 7.04741 14.11 7.14C14.6951 7.97897 15.0087 8.97718 15.0087 10ZM4 19C4 19 4 15 10 15C16 15 16 19 16 19V21H4V19ZM10 17C6.32 17 6 18.71 6 19H14C13.94 18.56 13.5 17 10 17ZM21 21V19C21 19 21 15.55 16.2 15.06C16.7466 15.5643 17.1873 16.1724 17.4964 16.8489C17.8054 17.5254 17.9766 18.2566 18 19V21H21Z"/></svg>',
			isExternalIcon: true,
			link: '/administration/groups/classes',
		});
	}

	res.locals.sidebarItems.push({
		name: 'divider',
	});

	res.locals.sidebarItems.push({
		name: res.$t('global.link.management'),
		testId: 'Verwaltung',
		icon: 'cog-outline',
		link: '/administration/',
		permission: 'STUDENT_LIST',
		excludedPermission: 'ADMIN_VIEW',
		groupName: 'administration',
		children: teacherChildren,
	});

	res.locals.sidebarItems.push({
		name: res.$t('global.link.management'),
		testId: 'Verwaltung',
		icon: 'cog-outline',
		link: '/administration/',
		permission: 'TEACHER_LIST',
		excludedPermission: ['ADMIN_VIEW', 'STUDENT_LIST'],
		groupName: 'administration',
		children: teacherChildrenWithoutStudents,
	});

	// admin views
	const newSchoolAdminPageAsDefault = Configuration.get('FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED');
	const adminChildItems = [
		{
			name: res.$t('global.link.administrationStudents'),
			testId: 'Schüler:innen',
			icon: 'account-school-outline',
			link: '/administration/students/',
		},
		{
			name: res.$t('global.link.managementTeachers'),
			testId: 'Lehrkräfte',
			icon: // eslint-disable-next-line max-len
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 17C20.5304 17 21.0391 16.7893 21.4142 16.4142C21.7893 16.0391 22 15.5304 22 15V4C22 3.46957 21.7893 2.96086 21.4142 2.58579C21.0391 2.21071 20.5304 2 20 2H9.46C9.81 2.61 10 3.3 10 4H20V15H11V17M15 9V11L9 9V22H7V16H5V22H3V14H1.5V9C1.5 8.46957 1.71071 7.96086 2.08579 7.58579C2.46086 7.21071 2.96957 7 3.5 7H9L15 9ZM8 4C8 4.53043 7.78929 5.03914 7.41421 5.41421C7.03914 5.78929 6.53043 6 6 6C5.46957 6 4.96086 5.78929 4.58579 5.41421C4.21071 5.03914 4 4.53043 4 4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2C6.53043 2 7.03914 2.21071 7.41421 2.58579C7.78929 2.96086 8 3.46957 8 4Z"/></svg>',
			isExternalIcon: true,
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
			icon: // eslint-disable-next-line max-len
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 4H20V15.1648C20.7778 15.62 21.3824 16.1788 21.8399 16.7855C21.9429 16.5443 22 16.2788 22 16V4C22 2.89543 21.1046 2 20 2H4C2.89543 2 2 2.89543 2 4V16C2 16.6043 2.26802 17.146 2.69168 17.5128C2.81915 17.279 2.97043 17.0394 3.15 16.8C3.39346 16.4754 3.67575 16.1677 4 15.8832V4ZM11.6667 12.4944C11.1734 12.8241 10.5933 13 10 13C9.20435 13 8.44129 12.6839 7.87868 12.1213C7.31607 11.5587 7 10.7957 7 10C7 9.40666 7.17595 8.82664 7.50559 8.33329C7.83524 7.83994 8.30377 7.45543 8.85195 7.22836C9.40013 7.0013 10.0033 6.94189 10.5853 7.05765C11.1672 7.1734 11.7018 7.45912 12.1213 7.87868C12.5409 8.29824 12.8266 8.83279 12.9424 9.41473C13.0581 9.99667 12.9987 10.5999 12.7716 11.1481C12.5446 11.6962 12.1601 12.1648 11.6667 12.4944ZM10.5556 9.16853C10.3911 9.05865 10.1978 9 10 9C9.73478 9 9.48043 9.10536 9.29289 9.29289C9.10536 9.48043 9 9.73478 9 10C9 10.1978 9.05865 10.3911 9.16853 10.5556C9.27841 10.72 9.43459 10.8482 9.61732 10.9239C9.80004 10.9996 10.0011 11.0194 10.1951 10.9808C10.3891 10.9422 10.5673 10.847 10.7071 10.7071C10.847 10.5673 10.9422 10.3891 10.9808 10.1951C11.0194 10.0011 10.9996 9.80004 10.9239 9.61732C10.8482 9.43459 10.72 9.27841 10.5556 9.16853ZM15.0087 10C15.0087 11.0228 14.6951 12.021 14.11 12.86C14.3976 12.9526 14.6979 12.9998 15 13C15.7956 13 16.5587 12.6839 17.1213 12.1213C17.6839 11.5587 18 10.7957 18 10C18 9.20435 17.6839 8.44129 17.1213 7.87868C16.5587 7.31607 15.7956 7 15 7C14.6979 7.00018 14.3976 7.04741 14.11 7.14C14.6951 7.97897 15.0087 8.97718 15.0087 10ZM4 19C4 19 4 15 10 15C16 15 16 19 16 19V21H4V19ZM10 17C6.32 17 6 18.71 6 19H14C13.94 18.56 13.5 17 10 17ZM21 21V19C21 19 21 15.55 16.2 15.06C16.7466 15.5643 17.1873 16.1724 17.4964 16.8489C17.8054 17.5254 17.9766 18.2566 18 19V21H21Z"/></svg>',
			isExternalIcon: true,
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
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M22 22V11H17V2L2 7V22H22ZM4 8.3736L15 4.91206V11H10V20H4V8.3736ZM15 20H12V13H20V20H17V17H15V20Z"/></svg>',
			isExternalIcon: true,
			link: newSchoolAdminPageAsDefault
				? '/administration/school-settings/'
				: '/administration/school/',
		},
	];

	if (newClassViewEnabled) {
		adminChildItems.splice(3, 1, {
			name: res.$t('global.sidebar.link.administrationClasses'),
			testId: 'Klassen',
			icon: // eslint-disable-next-line max-len
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 4H20V15.1648C20.7778 15.62 21.3824 16.1788 21.8399 16.7855C21.9429 16.5443 22 16.2788 22 16V4C22 2.89543 21.1046 2 20 2H4C2.89543 2 2 2.89543 2 4V16C2 16.6043 2.26802 17.146 2.69168 17.5128C2.81915 17.279 2.97043 17.0394 3.15 16.8C3.39346 16.4754 3.67575 16.1677 4 15.8832V4ZM11.6667 12.4944C11.1734 12.8241 10.5933 13 10 13C9.20435 13 8.44129 12.6839 7.87868 12.1213C7.31607 11.5587 7 10.7957 7 10C7 9.40666 7.17595 8.82664 7.50559 8.33329C7.83524 7.83994 8.30377 7.45543 8.85195 7.22836C9.40013 7.0013 10.0033 6.94189 10.5853 7.05765C11.1672 7.1734 11.7018 7.45912 12.1213 7.87868C12.5409 8.29824 12.8266 8.83279 12.9424 9.41473C13.0581 9.99667 12.9987 10.5999 12.7716 11.1481C12.5446 11.6962 12.1601 12.1648 11.6667 12.4944ZM10.5556 9.16853C10.3911 9.05865 10.1978 9 10 9C9.73478 9 9.48043 9.10536 9.29289 9.29289C9.10536 9.48043 9 9.73478 9 10C9 10.1978 9.05865 10.3911 9.16853 10.5556C9.27841 10.72 9.43459 10.8482 9.61732 10.9239C9.80004 10.9996 10.0011 11.0194 10.1951 10.9808C10.3891 10.9422 10.5673 10.847 10.7071 10.7071C10.847 10.5673 10.9422 10.3891 10.9808 10.1951C11.0194 10.0011 10.9996 9.80004 10.9239 9.61732C10.8482 9.43459 10.72 9.27841 10.5556 9.16853ZM15.0087 10C15.0087 11.0228 14.6951 12.021 14.11 12.86C14.3976 12.9526 14.6979 12.9998 15 13C15.7956 13 16.5587 12.6839 17.1213 12.1213C17.6839 11.5587 18 10.7957 18 10C18 9.20435 17.6839 8.44129 17.1213 7.87868C16.5587 7.31607 15.7956 7 15 7C14.6979 7.00018 14.3976 7.04741 14.11 7.14C14.6951 7.97897 15.0087 8.97718 15.0087 10ZM4 19C4 19 4 15 10 15C16 15 16 19 16 19V21H4V19ZM10 17C6.32 17 6 18.71 6 19H14C13.94 18.56 13.5 17 10 17ZM21 21V19C21 19 21 15.55 16.2 15.06C16.7466 15.5643 17.1873 16.1724 17.4964 16.8489C17.8054 17.5254 17.9766 18.2566 18 19V21H21Z"/></svg>',
			isExternalIcon: true,
			link: '/administration/groups/classes',
		});
	}

	res.locals.sidebarItems.push({
		name: res.$t('global.link.management'),
		testId: 'Verwaltung',
		icon: 'cog-outline',
		link: '/administration/',
		permission: 'ADMIN_VIEW',
		groupName: 'administration',
		children: adminChildItems,
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
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M4 18H10.2308C10.243 18.0318 10.2556 18.0635 10.2687 18.0949C9.75581 18.4912 9.20115 19.1201 9.0438 20H4C3.46957 20 2.96086 19.7893 2.58579 19.4142C2.21071 19.0391 2 18.5304 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V13.5877C21.5356 13.3674 21.0238 13.25 20.5 13.25C20.331 13.25 20.164 13.262 20 13.2855V8H4V18ZM18.2374 14.2626C17.9092 13.9344 17.4641 13.75 17 13.75C16.5359 13.75 16.0908 13.9344 15.7626 14.2626C15.4344 14.5908 15.25 15.0359 15.25 15.5C15.25 15.9641 15.4344 16.4092 15.7626 16.7374C16.0908 17.0656 16.5359 17.25 17 17.25C17.4641 17.25 17.9092 17.0656 18.2374 16.7374C18.5656 16.4092 18.75 15.9641 18.75 15.5C18.75 15.0359 18.5656 14.5908 18.2374 14.2626ZM14.265 15.21C14.04 15.075 13.78 15 13.5 15C13.1022 15 12.7206 15.158 12.4393 15.4393C12.158 15.7206 12 16.1022 12 16.5C12 16.8978 12.158 17.2794 12.4393 17.5607C12.7206 17.842 13.1022 18 13.5 18C14.08 18 14.58 17.67 14.83 17.19C14.4 16.635 14.19 15.925 14.265 15.21ZM21.5607 15.4393C21.2794 15.158 20.8978 15 20.5 15C20.22 15 19.96 15.075 19.735 15.21C19.81 15.925 19.6 16.635 19.17 17.19C19.42 17.67 19.92 18 20.5 18C20.8978 18 21.2794 17.842 21.5607 17.5607C21.842 17.2794 22 16.8978 22 16.5C22 16.1022 21.842 15.7206 21.5607 15.4393ZM17 18.25C15.205 18.25 13.75 19.09 13.75 20.125V21H20.25V20.125C20.25 19.09 18.795 18.25 17 18.25ZM11 20.25V21H12.75V20.125C12.75 19.61 12.93 19.14 13.225 18.8C11.945 18.97 11 19.555 11 20.25ZM21.25 21H23V20.25C23 19.555 22.055 18.97 20.775 18.8C21.07 19.14 21.25 19.61 21.25 20.125V21Z"/></svg>',
			isExternalIcon: true,
			link: '/files/teams/',
		});
	}
	// helpArea view
	res.locals.sidebarItems.push({
		name: res.$t('global.link.helpArea'),
		testId: 'Hilfebereich',
		icon: 'help-circle-outline',
		link: '/help/',
		groupName: 'help',
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


	// new sidebar

	if (Configuration.get('FEATURE_NEW_LAYOUT_ENABLED')) {
		// system group
		const systemLinks = [];

		if (ALERT_STATUS_URL) {
			systemLinks.push({
				link: ALERT_STATUS_URL,
				name: res.$t('lib.global.link.status'),
				testId: 'status',
				isExternalLink: true,
			});
		}

		systemLinks.push({
			name: res.$t('lib.help_menu.link.releaseNotes'),
			link: '/help/releases',
			testId: 'releases',
		});

		if (SC_THEME !== 'default') {
			systemLinks.push({
				link: res.locals.theme.documents.specificFiles.accessibilityStatement,
				name: res.$t('lib.global.link.accessibilityStatement'),
				testId: 'accessibility-statement',
				isExternalLink: true,
			});
		}

		if (SC_THEME !== 'n21') {
			systemLinks.push({
				name: res.$t('lib.global.link.github'),
				link: 'https://github.com/hpi-schul-cloud',
				testId: 'github',
				isExternalLink: true,
			});
		}

		if (SC_THEME === 'default') {
			systemLinks.push({
				link: '/security',
				name: res.$t('lib.global.link.safety'),
				testId: 'security',
			});
		}

		res.locals.sidebarItems.push(
			{
				name: res.$t('global.sidebar.link.system'),
				icon: 'application-brackets-outline',
				testId: 'system',
				groupName: 'system',
				children: systemLinks,
			},
		);
	}

	// end new sidebar

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
				notificationCount += 1;
			}

			return notification;
		});
		res.locals.recentNotifications = notificationCount;
		next();
	});
};
