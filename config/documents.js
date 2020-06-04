const { URL } = require('url');

const { DOCUMENT_BASE_DIR, SC_THEME } = require('./global');

const specificFiles = {
	privacyExemplary: 'Onlineeinwilligung/Datenschutzerklaerung-Muster-Schulen-Onlineeinwilligung.pdf',
	privacy: 'Onlineeinwilligung/Datenschutzerklaerung-Onlineeinwilligung.pdf',
	termsOfUseExemplary: 'Onlineeinwilligung/Nutzungsordnung-HPI-Schule-Schueler-Onlineeinwilligung.pdf',
	termsOfUse: 'Onlineeinwilligung/Nutzungsordnung-Onlineeinwilligung.pdf',
	termsOfUseSchool: 'Willkommensordner/Datenschutz/Nutzungsordnung-HPI-Schule-Schueler.pdf',
};

const globalFiles = {
	BeschreibungDerSchulCloud: 'Dokumente/Beschreibung-der-HPI-Schul-Cloud.pdf',
	TechnischerBericht2019:
	'Dokumente/Die-HPI-Schul-Cloud_Roll-Out-einer-Cloud-Architektur-für-Schulen-in-Deutschland.pdf',
	BroschuereSCimUnterricht1:
	'Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-Fachuebergreifende-Unterrichtsszenarien-und-Methoden.pdf',
	BroschuereSCimUnterricht2:
	'Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-und-Schulalltag-Mehrwert-und-Voraussetzungen.pdf',
	BroschuereSCundLernen4:
	'Willkommensordner/Begleitmaterial/Broschuere_HPI-Schul-Cloud-und-Lernen-4.0.pdf',
	SchulrechnerInDieSC2017: 'Dokumente/Schulrechner-wandern-in-die-Cloud-2017.pdf',
	SCKonzeptPilotierung2017: 'Dokumente/Konzept-und-Pilotierung-der-Schul-Cloud-2017.pdf',
};

module.exports = {
	defaultDocuments: () => ({
		documentBaseDir: String(new URL(`${SC_THEME}/`, DOCUMENT_BASE_DIR)),
		specificFiles: baseDir => Object.entries(specificFiles).reduce((obj, [key, value]) => {
			obj[key] = String(new URL(value, baseDir));
			return obj;
		}, {}),
		globalFiles: () => Object.entries(globalFiles).reduce((obj, [key, value]) => {
			obj[key] = String(new URL(`global/${value}`, DOCUMENT_BASE_DIR));
			return obj;
		}, {}),
	}),
	specificFiles,
};
