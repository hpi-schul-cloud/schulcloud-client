/* eslint-disable no-console */
const moment = require('moment');
const truncatehtml = require('truncate-html');
const stripHtml = require('string-strip-html');
const { Configuration } = require('@schul-cloud/commons');
const permissionsHelper = require('../../permissions');
const i18n = require('../../i18n');
const Globals = require('../../../config/global');
const timesHelper = require('../../timesHelper');

moment.locale('de');

const ifCondBool = (v1, operator, v2) => {
	switch (operator) {
		case '==':
			return (v1 == v2);
		case '===':
			return (v1 === v2);
		case '!=':
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
			return false;
	}
};

const helpers = () => ({
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
	notInArray: (item, array = [], opts) => {
		if (!array.includes(item)) {
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
	truncateHTML: (text = '', _length, _stripTags) => {
		// set default values
		const length = typeof _length !== 'number' ? 140 : _length;
		const stripTags = typeof _stripTags !== 'boolean' ? true : _stripTags;
		return truncatehtml(text, length, { stripTags, decodeEntities: true });
	},
	truncateLength: (text = '', length = 140) => {
		if (text.length <= length) {
			return text;
		}
		const subString = text.substr(0, length);
		return `${(subString.indexOf(' ') > -1) ? subString.substr(0, subString.lastIndexOf(' ')) : subString}...`;
	},
	truncateArray: (rawArray = [], length = 0) => {
		const truncatedArray = rawArray;
		if (length > 0 && length <= truncatedArray.length) {
			truncatedArray.length = length;
		}
		return truncatedArray;
	},
	stripHTMLTags: (htmlText = '') => stripHtml(htmlText),
	stripOnlyScript: (htmlText = '') => stripHtml(htmlText, { onlyStripTags: ['script', 'style'] }),
	conflictFreeHtml: (text = '') => {
		text = text.replace(/style=["'][^"]*["']/g, '');
		text = text.replace(/<(a).*?>(.*?)<\/(?:\1)>/g, '$2');
		return text;
	},
	ifCond: (v1, operator, v2, options) => (ifCondBool(v1, operator, v2)
		? options.fn(this)
		: options.inverse(this)),
	isCond: (v1, operator, v2, options) => ifCondBool(v1, operator, v2),
	ifeq: (a, b, opts) => {
		if (a == b) {
			return opts.fn(this);
		}
		return opts.inverse(this);
	},
	ifneq: (a, b, opts) => {
		if (a !== b) {
			return opts.fn(this);
		}
		return opts.inverse(this);
	},
	ifvalue: (conditional, options) => {
		if (options.hash.value === conditional) {
			return options.fn(this);
		}
		return options.inverse(this);
	},
	ifEnv: (env_variable, value, options) => {
		if (Globals[env_variable] === value) {
			return options.fn(this);
		}
		return options.inverse(this);
	},
	unlessEnv: (env_variable, value, options) => {
		if (Globals[env_variable] === value) {
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
	getConfig: (key) => {
		return Configuration.get(key);
	},
	userInitials: (opts) => {
		return opts.data.local.currentUser.avatarInitials;
	},
	userHasPermission: (permission, opts) => {
		if (permissionsHelper.userHasPermission(opts.data.local.currentUser, permission)) {
			return opts.fn(this);
		}
		return opts.inverse(this);
	},
	userHasRole: (...args) => {
		const allowedRoles = Array.from(args);
		const opts = allowedRoles.pop();
		return opts.data.local.currentUser.roles.some(r => allowedRoles.includes(r.name));
	},
	userIsAllowedToViewContent: (isNonOerContent = false, options) => {
		// Always allow nonOer content, otherwise check user is allowed to view nonOer content
		if (permissionsHelper.userHasPermission(options.data.local.currentUser, 'CONTENT_NON_OER_VIEW') || !isNonOerContent) {
			return options.fn(this);
		}
		return options.inverse(this);
	},
	userIds: (users) => (users || []).map((user) => user._id).join(','),
	timeFromNow: (date, opts) => timesHelper.fromNow(date),
	datePickerTodayMinus: (years, months, days, format) => {
		if (typeof (format) !== 'string') {
			format = 'YYYY.MM.DD';
		}
		return moment()
			.subtract(years, 'years')
			.subtract(months, 'months')
			.subtract(days, 'days')
			.format(format);
	},
	dateToPicker: (date) => timesHelper.moment(date).format(i18n.getInstance()('format.dateToPicker')),
	dateTimeToPicker: (date) => timesHelper.moment(date).format(i18n.getInstance()('format.dateTimeToPicker')),
	i18nDate: (date) => timesHelper.moment(date).format(i18n.getInstance()('format.date')),
	i18nDateTime: (date) => timesHelper.moment(date).format(i18n.getInstance()('format.dateTime')),
	i18nDateString: (date) => timesHelper.moment(date).format(i18n.getInstance()('format.dateLong')),
	timeToString: (date) => timesHelper.timeToString(date, i18n.getInstance()('format.dateTime')),
	currentYear() {
		return new Date().getFullYear();
	},
	concat() {
		const arg = Array.prototype.slice.call(arguments, 0);
		arg.pop();
		return arg.join('');
	},
	log: (data) => {
		console.log(data);
	},
	castStatusCodeToString: (statusCode, data) => {
		console.log(statusCode);
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
	writeFileSizePretty: (fileSize) => {
		let unit;
		let iterator = 0;

		while (fileSize > 1024) {
			fileSize = Math.round((fileSize / 1024) * 100) / 100;
			iterator++;
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
		}
		return (`${fileSize} ${unit}`);
	},
	json: data => JSON.stringify(data),
	jsonParse: data => JSON.parse(data),
	times: (n, block) => {
		let accum = '';
		for (let i = 0; i < n; ++i) {
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
	escapeHtml: text => text
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;'),
	encodeURI: data => encodeURI(data),
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
});

module.exports = helpers;
