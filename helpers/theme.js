const { defaultDocuments } = require('../config/documents.js');
const {
	SC_THEME,
	SC_TITLE,
	SC_SHORT_TITLE,
	HOST,
} = require('../config/global');

const setTheme = (res) => {
	const documents = defaultDocuments();
	const baseDir = (res.locals.currentSchoolData || {}).documentBaseDir || documents.documentBaseDir;

	res.locals.theme = {
		name: 'n21',
		title: SC_TITLE,
		short_title: SC_SHORT_TITLE,
		documents: {
			baseDir,
			specificFiles: documents.specificFiles(baseDir),
			globalFiles: documents.globalFiles(),
		},
		url: HOST,
	};
};

module.exports = setTheme;
