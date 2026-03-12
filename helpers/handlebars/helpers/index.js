const moment = require('moment');
const { stripHtml } = require('string-strip-html');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { getStaticAssetPath } = require('../../../middleware/assets');
const permissionsHelper = require('../../permissions');
const i18n = require('../../i18n');
const filesStorage = require('../../files-storage');
const timesHelper = require('../../timesHelper');

moment.locale('de');
const ifCondBool = (v1, operator, v2) => {
	switch (operator) {
		case '==':
			// eslint-disable-next-line eqeqeq
			return (v1 == v2);
		case '===':
			return (v1 === v2);
		case '!=':
			// eslint-disable-next-line eqeqeq
			return (v1 != v2);
		case '!==':
			return (v1 !== v2);
		case '<':
			return (v1 < v2);
		case '<=':
			return (v1 <= v2);
		case '>':
			return (v1 > v2);
		case '>=':
			return (v1 >= v2);
		case '&&':
			return (v1 && v2);
		case '&& !':
			return (v1 && !v2);
		case '||':
			return (v1 || v2);
		case '|| !':
			return (v1 || !v2);
		default:
			throw new Error(`Passed condition has an invalid operator ${operator}`);
	}
};

const helpers = () => ({
	// eslint-disable-next-line global-require
	pagination: require('./pagination'),
	ifArray: (item, options) => {
		if (Array.isArray(item)) {
			return options.fn(item);
		}
		return options.inverse(item);
	},
	inArray: (item, array = [], opts) => {
		if (array.includes(item)) {
			return opts.fn(this);
		}
		return opts.inverse(this);
	},
	arrayLength: (array) => (array && array.length) || 0,
	truncate: (text = '', { length = 140 } = {}) => {
		if (text.length <= length) {
			return text;
		}
		const subString = text.substr(0, length - 1);
		return `${subString.substr(0, subString.lastIndexOf(' '))}...`;
	},
	truncatePure: (text = '', length = 140) => {
		if (text.length <= length) {
			return text;
		}
		const subString = text.substr(0, length - 1);
		return `${subString}...`;
	},
	stripHTMLTags: (htmlText = '') => stripHtml(htmlText).result,
	stripOnlyScript: (htmlText = '') => stripHtml(htmlText, {
		cb: ({
			tag,
			deleteFrom,
			deleteTo,
			insert,
			rangesArr,
		}) => {
			if (['script', 'style'].includes(tag.name.toLowerCase() === 'script')) {
				rangesArr.push(
					tag.lastOpeningBracketAt,
					tag.lastClosingBracketAt + 1,
				);
			} else {
				rangesArr.push(deleteFrom, deleteTo, insert);
			}
		},
	}).result,
	conflictFreeHtml: (text = '') => {
		const withoutInlineStyles = text.replaceAll(/style=["'][^"]*["']/g, '');
		const withoutAnchorTags = withoutInlineStyles.replaceAll(/<(a).*?>(.*?)<\/(?:\1)>/g, '$2');

		return withoutAnchorTags;
	},
	ifCond: (v1, operator, v2, options) => (ifCondBool(v1, operator, v2)
		? options.fn(this)
		: options.inverse(this)),
	isCond: (v1, operator, v2, options) => ifCondBool(v1, operator, v2),
	ifeq: (a, b, options) => {
		// eslint-disable-next-line eqeqeq
		if (a == b) {
			return options.fn(this);
		}
		return options.inverse(this);
	},
	ifneq: (a, b, options) => {
		if (a !== b) {
			return options.fn(this);
		}
		return options.inverse(this);
	},
	ifvalue: (conditional, options) => {
		if (options.hash.value === conditional) {
			return options.fn(this);
		}
		return options.inverse(this);
	},
	unlessEnv: (configKey, value, options) => {
		if (Configuration.has(configKey) && Configuration.get(configKey) === value) {
			return options.inverse(this);
		}
		return options.fn(this);
	},
	ifConfig: (key, value, options) => {
		const exist = Configuration.has(key);
		if (exist && Configuration.get(key) === value) {
			return options.fn(this);
		}
		return options.inverse(this);
	},
	hasConfig: (key, options) => {
		if (Configuration.has(key)) {
			return options.fn(this);
		}
		return options.inverse(this);
	},
	getConfig: (key) => Configuration.get(key),
	userHasPermission: (permission, opts) => {
		if (permissionsHelper.userHasPermission(opts.data.local.currentUser, permission)) {
			return opts.fn(this);
		}
		return opts.inverse(this);
	},
	userHasRole: (...args) => {
		const allowedRoles = Array.from(args);
		const opts = allowedRoles.pop();
		return opts.data.local.currentUser.roles.some((r) => allowedRoles.includes(r.name));
	},
	userHasRoleFromArray: (args, currentUser) => {
		const allowedRoles = args
			.split(',')
			.map((role) => role.trim());
		return currentUser.roles.some((r) => allowedRoles.includes(r.name));
	},
	userIds: (users) => (users || []).map((user) => user._id).join(','),
	getAssetPath: (assetPath) => getStaticAssetPath(assetPath),
	timeFromNow: (date) => timesHelper.fromNow(date),
	timeFromNowWithRule: (date) => timesHelper.fromNowWithRule(date),
	datePickerTodayMinus: (years, months, days, format) => {
		const dateFormat = typeof format === 'string' ? format : 'YYYY.MM.DD';
		return moment()
			.subtract(years, 'years')
			.subtract(months, 'months')
			.subtract(days, 'days')
			.format(dateFormat);
	},
	dateToPicker: (date) => timesHelper.formatDate(date, i18n.getInstance()('format.dateToPicker')),
	dateTimeToPicker: (date) => timesHelper.formatDate(date, i18n.getInstance()('format.dateTimeToPicker')),
	i18nDate: (date) => timesHelper.dateToDateString(date),
	i18nDateTime: (date) => timesHelper.dateToDateTimeString(date, true),
	timeToString: (date) => timesHelper.timeToString(date),
	currentYear: () => timesHelper.currentDate().year(),
	concat(...args) {
		args.pop();
		return args.join('');
	},
	log: (data) => {
		// eslint-disable-next-line no-console
		console.log(data);
	},
	castStatusCodeToString: (statusCode, data) => {
		if (statusCode >= 500) {
			return i18n.getInstance(data.data.local.currentUser)('global.text.internalProblem');
		}
		if (statusCode >= 400) {
			if ([400, 401, 402, 403, 404, 408].includes(statusCode)) {
				return i18n.getInstance(data.data.local.currentUser)('global.text.'.concat(statusCode.toString()));
			}
		}

		if (statusCode > 300) {
			return i18n.getInstance(data.data.local.currentUser)('global.text.pageMoved');
		}
		return i18n.getInstance(data.data.local.currentUser)('global.text.somethingWentWrong');
	},
	writeFileSizePretty: (sourceFileSize) => {
		let fileSize = sourceFileSize;
		let unit;
		let iterator = 0;

		while (fileSize > 1024) {
			fileSize = Math.round((fileSize / 1024) * 100) / 100;
			iterator += 1;
		}
		switch (iterator) {
			case 0:
				unit = 'B';
				break;
			case 1:
				unit = 'KB';
				break;
			case 2:
				unit = 'MB';
				break;
			case 3:
				unit = 'GB';
				break;
			case 4:
				unit = 'TB';
				break;
			default:
				break;
		}
		return (`${fileSize} ${unit}`);
	},
	json: (data) => JSON.stringify(data),
	jsonParse: (data) => JSON.parse(data),
	times: (n, block) => {
		let accum = '';
		for (let i = 0; i < n; i += 1) {
			accum += block.fn(i);
		}
		return accum;
	},
	for: (from, to, incr, block) => {
		let accum = '';
		for (let i = from; i < to; i += incr) {
			accum += block.fn(i);
		}
		return accum;
	},
	add: (a, b) => a + b,
	indexOf: (item, searchValue, fromIndex) => item.indexOf(searchValue, fromIndex),
	escapeHtml: (text) => text
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;'),
	encodeURI: (data) => encodeURI(data),
	$t: (key, data, opts) => {
		if (!opts) {
			return i18n.getInstance(data.data.local.currentUser)(key);
		}
		return i18n.getInstance(opts.data.local.currentUser)(key, data);
	},
	dict: (...keyValues) => {
		const dict = {};
		keyValues.forEach((keyValue, index) => {
			if (!(index % 2)) {
				dict[keyValue] = keyValues[index + 1];
			}
		});
		return dict;
	},
	isset: (value) => !!value,
	getThumbnailIcon: (filename) => filesStorage.getThumbnailIcon(filename),
});

module.exports = helpers;
