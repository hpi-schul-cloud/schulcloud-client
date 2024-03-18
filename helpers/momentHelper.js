const uk = require('../locales/calendar/uk.json');
const es = require('../locales/calendar/es.json');

/*
// const CONFIG_ORIG = i18nMoment().locale('en').localeData()._relativeTime;
const relativeTime = {
	d: 'a day',
	dd: '%d days',
	future: 'in %s',
	h: 'an hour',
	hh: '%d hours',
	m: 'a minute',
	M: 'a month',
	mm: '%d minutes',
	MM: '%d months',
	past: '%s ago',
	s: 'a few seconds',
	ss: '%d seconds',
	w: 'a week',
	ww: '%d weeks',
	y: 'a year',
};
*/

const createCustomRelativeTimeConfig = (localFile) => ({
	d: `${localFile['moment.relativeTime.aDay']}`,
	dd: `%d ${localFile['moment.relativeTime.days']}`,
	future: `${localFile['moment.relativeTime.futureIn']} %s`,
	h: `${localFile['moment.relativeTime.anHour']}`,
	hh: `%d ${localFile['moment.relativeTime.hours']}`,
	m: `${localFile['moment.relativeTime.aMinute']}`,
	M: `${localFile['moment.relativeTime.aMonths']}`,
	mm: `%d ${localFile['moment.relativeTime.minutes']}`,
	MM: `%d ${localFile['moment.relativeTime.months']}`,
	past: `%s ${localFile['moment.relativeTime.pastAgo']}`,
	s: `${localFile['moment.relativeTime.aFewSecondes']}`,
	ss: `%d ${localFile['moment.relativeTime.seconds']}`,
	w: `${localFile['moment.relativeTime.aWeek']}`,
	ww: `%d ${localFile['moment.relativeTime.weeks']}`,
	y: `${localFile['moment.relativeTime.aYear']}`,
});

const selectMomentOptions = (langAttribute) => {
	const options = {};

	if (langAttribute === 'uk') {
		options.relativeTime = createCustomRelativeTimeConfig(uk);
	}
	if (langAttribute === 'es') {
		options.relativeTime = createCustomRelativeTimeConfig(es);
	}

	return options;
};

module.exports = {
	selectMomentOptions,
};
