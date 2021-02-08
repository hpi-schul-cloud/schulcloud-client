const chai = require('chai');

const { expect } = chai;

const rawDeJson = require('../../../locales/de.json');
const rawEnJson = require('../../../locales/en.json');

const allowedTypes = ['button', 'headline', 'link', 'text', 'format',
	'placeholder', 'input', 'label', 'img_alt', 'tab_label', 'aria_label'];

// new format: {"about.button.showLess" : "Weniger anzeigen"}
function formatJson(json, object, path = '') {
	for (const key in json) {
		if (Object.prototype.hasOwnProperty.call(json, key)) {
			if (typeof (json[key]) !== 'string') {
				formatJson(json[key], object, (path === '') ? key : `${path}.${key}`);
			} else {
				object[`${path}.${key}`] = json[key];
			}
		}
	}
}
function getWrongTypes(json) {
	const foundViolations = [];
	for (const key in json) {
		if (Object.prototype.hasOwnProperty.call(json, key)) {
			const path = key.split('.');
			if (path.length < 2 || !allowedTypes.includes(path[path.length - 2])) {
				foundViolations.push(key);
			}
		}
	}
	return foundViolations;
}

function getDuplicates(json) {
	const foundViolations = [];
	const valuesByType = {};
	for (const key in json) {
		if (Object.prototype.hasOwnProperty.call(json, key)) {
			const path = key.split('.');
			if (path.length > 2) {
				// different types are allowed to have the same text, so we sort by type:
				const type = path[path.length - 2];
				if (!Object.prototype.hasOwnProperty.call(valuesByType, type)) {
					valuesByType[type] = [json[key]];
				} else if (valuesByType[type].includes(json[key])) {
					foundViolations.push(key);
				} else {
					valuesByType[type].push(json[key]);
				}
			}
		}
	}
	return foundViolations;
}

describe.only('i18n test de.json', () => {
	const DEjson = {};
	const ENjson = {};
	const ESjson = {};


	it('Load de.json', () => {
		formatJson(rawDeJson, DEjson);
	});

	it('Load en.json', () => {
		formatJson(rawEnJson, ENjson);
	});

	it('Load es.json', () => {
		formatJson(rawEnJson, ESjson);
	});

	it('Check for usage of right types', () => {
		const wrongKeys = getWrongTypes(DEjson);
		expect(JSON.stringify(wrongKeys)).to.equal(JSON.stringify([]),
			`The second last type of a key should be one of the following; ${allowedTypes}`);
	});

	it('Check for duplicates', () => {
		const wrongKeys = getDuplicates(DEjson);
		expect(JSON.stringify(wrongKeys)).to.equal(JSON.stringify([]),
			'There is already another key with the same text.');
	});

	it('Check if de.json and en.json are in sync', () => {
		const deKeys = Object.getOwnPropertyNames(DEjson);
		const enKeys = Object.getOwnPropertyNames(ENjson);
		const difference = deKeys.filter((x) => !enKeys.includes(x))
			.concat(enKeys.filter((x) => !deKeys.includes(x)));
		expect(JSON.stringify(difference)).to.equal(JSON.stringify([]),
			'Some keys seem to be out of sync. Please add them in the de.json/en.json');
	});

	it('Check if de.json and es.json are in sync', () => {
		const deKeys = Object.getOwnPropertyNames(DEjson);
		const esKeys = Object.getOwnPropertyNames(ESjson);
		const difference = deKeys.filter((x) => !esKeys.includes(x))
			.concat(esKeys.filter((x) => !deKeys.includes(x)));
		expect(JSON.stringify(difference)).to.equal(JSON.stringify([]),
			'Some keys seem to be out of sync. Please add them in the de.json/es.json');
	});

	it('Check for empty keys', () => {
		const emptyKeys = [];
		const deKeys = Object.getOwnPropertyNames(DEjson);
		const enKeys = Object.getOwnPropertyNames(ENjson);
		const esKeys = Object.getOwnPropertyNames(ESjson);
		deKeys.forEach((key) => {
			if (DEjson[key] === '') {
				emptyKeys.push(key);
			}
		});
		enKeys.forEach((key) => {
			if (ENjson[key] === '') {
				emptyKeys.push(key);
			}
		});
		esKeys.forEach((key) => {
			if (ESjson[key] === '') {
				emptyKeys.push(key);
			}
		});
		expect(JSON.stringify(emptyKeys)).to.equal(JSON.stringify([]),
			'Some keys seem to be empty, please add a corresponding translation');
	});
});
