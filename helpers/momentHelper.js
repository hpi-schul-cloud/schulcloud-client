const uk = require('../locales/calendar/uk.json');
const es = require('../locales/calendar/es.json');
const de = require('../locales/calendar/de.json');

const createCustomRelativeTimeConfig = (localFile, lang) => {
	const commonConfig = {
		d: `${localFile['moment.relativeTime.aDay']}`, // e.g. "ein Tag"
		dd: `%d ${localFile['moment.relativeTime.days']}`, // e.g. "2 Tage"
		future: `${localFile['moment.relativeTime.futureIn']} %s`, // e.g. "in 3 Tagen"
		h: `${localFile['moment.relativeTime.anHour']}`, // e.g. "eine Stunde"
		hh: `%d ${localFile['moment.relativeTime.hours']}`, // e.g. "2 Stunden"
		m: `${localFile['moment.relativeTime.aMinute']}`, // e.g. "eine Minute"
		mm: `%d ${localFile['moment.relativeTime.minutes']}`, // e.g. "2 Minuten"
		M: `${localFile['moment.relativeTime.aMonth']}`, // e.g. "ein Monat"
		MM: `%d ${localFile['moment.relativeTime.months']}`, // e.g. "3 Monate"
		past: `%s ${localFile['moment.relativeTime.pastAgo']}`, // Standard
		s: `${localFile['moment.relativeTime.aFewSeconds']}`, // e.g. "ein paar Sekunden"
		ss: `%d ${localFile['moment.relativeTime.seconds']}`, // e.g. "5 Sekunden"
		w: `${localFile['moment.relativeTime.aWeek']}`, // e.g. "eine Woche"
		ww: `%d ${localFile['moment.relativeTime.weeks']}`, // e.g. "2 Wochen"
		y: `${localFile['moment.relativeTime.aYear']}`, // e.g. "ein Jahr"
		yy: `%d ${localFile['moment.relativeTime.years']}`, // e.g. "2 Jahre"
	};

	if (lang === 'de') {
		// specific adjustments for German
		commonConfig.past = (unit, value) => {
			if (value === 1) {
				// special cases for singular
				if (unit === 'd') return 'vor einem Tag';
				if (unit === 'h') return 'vor einer Stunde';
				if (unit === 'm') return 'vor einer Minute';
				if (unit === 'M') return 'vor einem Monat';
				if (unit === 'w') return 'vor einer Woche';
				if (unit === 'y') return 'vor einem Jahr';
			}
			// default for plural
			return `%s ${localFile['moment.relativeTime.pastAgo']}`;
		};
		commonConfig.future = (unit, value) => {
			if (value === 1) {
				// special cases for singular
				if (unit === 'd') return 'in einem Tag';
				if (unit === 'h') return 'in einer Stunde';
				if (unit === 'm') return 'in einer Minute';
				if (unit === 'M') return 'in einem Monat';
				if (unit === 'w') return 'in einer Woche';
				if (unit === 'y') return 'in einem Jahr';
			}
			// default for plural
			return 'in %s';
		};
	}

	return commonConfig;
};

const selectMomentOptions = (langAttribute) => {
	const options = {};

	if (langAttribute === 'uk') {
		options.relativeTime = createCustomRelativeTimeConfig(uk, 'uk');
	}
	if (langAttribute === 'es') {
		options.relativeTime = createCustomRelativeTimeConfig(es, 'es');
	}
	if (langAttribute === 'de') {
		options.relativeTime = createCustomRelativeTimeConfig(de, 'de');
	}

	return options;
};

module.exports = {
	selectMomentOptions,
};
