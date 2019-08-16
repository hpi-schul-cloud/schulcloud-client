const defaultDocuments = require('../config/documents.js');

const setTheme = (res, school) => {
	const baseDir = (res.locals.currentSchoolData || school || {}).documentBaseDir || defaultDocuments.documentBaseDir;
	res.locals.theme = {
		title: process.env.SC_TITLE || 'HPI Schul-Cloud',
		short_title: process.env.SC_SHORT_TITLE || 'Schul-Cloud',
		documents: Object.assign({}, {
			baseDir,
			baseFiles: defaultDocuments.baseFiles(baseDir),
			otherFiles: defaultDocuments.otherFiles,
		}),
		federalstate: process.env.SC_FEDERALSTATE || 'Brandenburg',
	};
};

module.exports = setTheme;
