const { Configuration } = require('@hpi-schul-cloud/commons');
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
			return '$t(administration.longText.cloudOperator.nbc)';
		case 'thr':
			return '$t(administration.longText.cloudOperator.tsc)';
		case 'brb':
			return '$t(administration.longText.cloudOperator.brb)';
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
		short_title: SC_TITLE, // depracted (SC_SHORT_TITLE removed)
		theme_title: themeTitle,
		institute_title: instituteTitle,
		documents: {
			baseDir,
			specificFiles: documents.specificFiles(baseDir),
			globalFiles: documents.globalFiles(),
		},
		url: HOST,
		status_url: ALERT_STATUS_URL,
		consent_necessary: Configuration.get('FEATURE_CONSENT_NECESSARY'),
	};
};

module.exports = setTheme;
