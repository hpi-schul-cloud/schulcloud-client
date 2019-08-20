const { defaultDocuments } = require('../config/documents.js');

const setTheme = (res) => {
	const documents = defaultDocuments();
	const baseDir = (res.locals.currentSchoolData || {}).documentBaseDir || documents.documentBaseDir;

	res.locals.theme = {
		title: process.env.SC_TITLE || 'HPI Schul-Cloud',
		short_title: process.env.SC_SHORT_TITLE || 'Schul-Cloud',
		documents: {
			baseDir,
			baseFiles: documents.baseFiles(baseDir),
			otherFiles: documents.otherFiles,
		},
		federalstate: process.env.SC_FEDERALSTATE || 'Brandenburg',
	};
};

module.exports = setTheme;
