const { defaultDocuments } = require('../config/documents.js');
const {
	SC_THEME,
	SC_TITLE,
	SC_SHORT_TITLE,
	HOST,
} = require('../config/global');

const instanceSpecificTitle = () => {
	switch (SC_THEME) {
		case 'n21':
			return 'Niedersächsischen Bildungscloud';
		default:
			return SC_TITLE;
	}
};

const instanceInstituteGerman = () => {
	switch (SC_THEME) {
		case 'n21':
			return 'der Landesinitiative n-21 Schulen in Niedersachsen online e.V';
		case 'thr':
			return 'dem Thüringer Institut für Lehrerfortbildung, Lehrplanentwicklung und Medien (Thillm)';
		case 'brb':
			return 'dem Ministerium für Bildung, Jugend und Sport (MBJS)';
		default:
			return 'Dataport';
	}
};

const instanceInstitute = () => {
	switch (SC_THEME) {
		case 'n21':
			return 'Landesinitiative n-21 Schulen in Niedersachsen online e.V';
		case 'thr':
			return 'Thüringer Institut für Lehrerfortbildung, Lehrplanentwicklung und Medien (Thillm)';
		case 'brb':
			return 'Ministerium für Bildung, Jugend und Sport (MBJS)';
		default:
			return 'Dataport';
	}
};

const setTheme = (res) => {
	const documents = defaultDocuments();
	const baseDir = (res.locals.currentSchoolData || {}).documentBaseDir || documents.documentBaseDir;
	const themeTitle = instanceSpecificTitle();
	const instituteTitleGerman = instanceInstituteGerman();
	const instituteTitle = instanceInstitute();

	res.locals.theme = {
		name: SC_THEME,
		title: SC_TITLE,
		short_title: SC_SHORT_TITLE,
		theme_title: themeTitle,
		institute_title_german: instituteTitleGerman,
		institute_title: instituteTitle,
		documents: {
			baseDir,
			specificFiles: documents.specificFiles(baseDir),
			globalFiles: documents.globalFiles(),
		},
		url: HOST,
	};
};

module.exports = setTheme;
