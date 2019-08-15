const { URL } = require('url');

const baseFiles = {
	privacy: 'Onlineeinwilligung/Datenschutzerklaerung-Muster-Schulen-Onlineeinwilligung.pdf',
	termsOfUse: 'Onlineeinwilligung/Nutzungsordnung-HPI-Schule-Schueler-Onlineeinwilligung.pdf',
};

module.exports = {
	documentBaseDir: process.env.DOCUMENT_BASE_DIR || 'https://schul-cloud-hpi.s3.hidrive.strato.com/',
	baseFiles: (baseDir) => {
		const retValue = {};
		Object.keys(baseFiles).forEach((key) => {
			retValue[key] = String(new URL(baseFiles[key], baseDir));
		});
		return retValue;
	},
	otherFiles: {},
};
