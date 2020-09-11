const chai = require('chai');

const { expect } = chai;

const deJson = require('../../../locales/de.json');

const allowedTypes = ['button', 'headline', 'link', 'text',
	'placeholder', 'input', 'label', 'img_alt', 'tab_label', 'aria_label'];

// new format: {"about.button.showLess" : "Weniger anzeigen"}
function formatJson(json, path, object) {
	for (const key in json) {
		if (Object.prototype.hasOwnProperty.call(json, key)) {
			if (typeof (json[key]) !== 'string') {
				formatJson(json[key], (path === '') ? key : `${path}.${key}`, object);
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
			if (path.length < 2) {
				foundViolations.push(key);
			} else if (!allowedTypes.includes(path[path.length - 2])) {
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

describe('i18n test de.json', () => {
	const json = {};
	it('Load Json', () => {
		formatJson(deJson, '', json);
	});
	it('Check for usage of right types', () => {
		const wrongKeys = getWrongTypes(json);
		expect(JSON.stringify(wrongKeys)).to.equal(JSON.stringify([]),
			`The second last type should be one of the following; ${allowedTypes}`);
	});
	it('Check for duplicates', () => {
		const wrongKeys = getDuplicates(json);
		expect(JSON.stringify(wrongKeys)).to.equal(JSON.stringify([]),
			'There is already another key with the same text.');
	});
});
