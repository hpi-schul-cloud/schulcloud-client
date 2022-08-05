const { defaultDocuments } = require('../config/documents');
const {
	SC_THEME,
	SC_TITLE,
	HOST,
	ALERT_STATUS_URL,
} = require('../config/global');

const instanceSpecificTitle = () => {
	switch (SC_THEME) {
		case 'n21':
			return 'Niedersächsischen Bildungscloud';
		default:
			return SC_TITLE;
	}
};

const instanceInstitute = () => {
	switch (SC_THEME) {
		case 'n21':
			return 'Landesinitiative n-21: Schulen in Niedersachsen online e.V.';
		case 'thr':
			return 'Thüringer Institut für Lehrerfortbildung, Lehrplanentwicklung und Medien';
		case 'brb':
			return 'Dataport';
		default:
			return 'Dataport';
	}
};

const setTheme = (res) => {
	const documents = defaultDocuments();
	const baseDir = (res.locals.currentSchoolData || {}).documentBaseDir || documents.documentBaseDir;
	const themeTitle = instanceSpecificTitle();
	const instituteTitle = instanceInstitute();

	res.locals.theme = {
		name: SC_THEME,
		title: SC_TITLE,
		theme_title: themeTitle,
		institute_title: instituteTitle,
		documents: {
			baseDir,
			specificFiles: documents.specificFiles(baseDir),
			globalFiles: documents.globalFiles(),
		},
		url: HOST,
		status_url: ALERT_STATUS_URL,
	};
};

module.exports = setTheme;
