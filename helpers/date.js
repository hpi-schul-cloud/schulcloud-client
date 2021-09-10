const moment = require('moment');

const DATE_FORMATS = {
	de: 'DD.MM.YYYY',
	en: 'MM/DD/YYYY',
	es: 'MM/DD/YYYY',
};

const normalizeDate = (srcDateString, lang) => {
	const srcFormat = DATE_FORMATS[lang];
	// we do not allow undefined as input => set to invalid empty string
	const date = moment(srcDateString || '', srcFormat);
	if (date.isValid()) {
		const dateString = date.format('DD.MM.YYYY');
		return dateString;
	}
	// TODO: i18n
	throw new Error('Ungültiges Datumsformat.');
};

module.exports = {
	normalizeDate,
};
