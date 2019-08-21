const { URL } = require('url');

const baseFiles = {
	privacy: 'Onlineeinwilligung/Datenschutzerklaerung-Muster-Schulen-Onlineeinwilligung.pdf',
	termsOfUse: 'Onlineeinwilligung/Nutzungsordnung-HPI-Schule-Schueler-Onlineeinwilligung.pdf',
};

module.exports = {
	defaultDocuments: () => ({
		documentBaseDir: process.env.DOCUMENT_BASE_DIR || 'https://schul-cloud-hpi.s3.hidrive.strato.com/',
		baseFiles: baseDir => Object.entries(baseFiles).reduce((obj, [key, value]) => {
			obj[key] = String(new URL(value, baseDir));
			return obj;
		}, {}),
		otherFiles: {},
	}),
};
