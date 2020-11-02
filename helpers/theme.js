const { defaultDocuments } = require('../config/documents.js');
const {
	SC_THEME,
	SC_TITLE,
	SC_SHORT_TITLE,
	HOST,
} = require('../config/global');

//Switch for all instance specific name exceptions (can be added here)
const instanceSpecificTitle = () => {
	switch (SC_THEME) {
		case "n21": 
			return "Niedersächsischen Bildungscloud";
		default: 
			return SC_TITLE;
	};
};

const setTheme = (res) => {
	const documents = defaultDocuments();
	const baseDir = (res.locals.currentSchoolData || {}).documentBaseDir || documents.documentBaseDir;
	const n_title = instanceSpecificTitle();

	res.locals.theme = {
		name: SC_THEME,
		title: SC_TITLE,
		short_title: SC_SHORT_TITLE,
		n_title: n_title,
		documents: {
			baseDir,
			specificFiles: documents.specificFiles(baseDir),
			globalFiles: documents.globalFiles(),
		},
		url: HOST,
	};
};

module.exports = setTheme;
