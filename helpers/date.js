const moment = require('moment');

const DATE_FORMATS = {
	de: 'DD.MM.YYYY',
	en: 'MM/DD/YYYY',
	es: 'MM/DD/YYYY',
};

/**
 * Convert local date string to ISO date string
 * @param {string} srcDateString
 * @param {string} lang
 * @returns {string} ISO date string
 */
const normalizeDate = (srcDateString, lang) => {
	const srcFormat = DATE_FORMATS[lang];
	if (srcFormat) {
		const date = moment(srcDateString, srcFormat);
		if (date.isValid()) {
			const dateString = date.format('YYYY-MM-DD');
			return dateString;
		}
	}
	// TODO: i18n
	throw new Error('Ungültiges Datumsformat.');
};

module.exports = {
	normalizeDate,
};
