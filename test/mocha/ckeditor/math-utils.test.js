const { expect } = require('chai');
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
const Module = require('module');

// The plugin sources are ES modules bundled by webpack; mocha runs plain CommonJS.
const loadEsmModule = (relativePath) => {
	const filename = path.resolve(__dirname, relativePath);
	const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
		filename,
		babelrc: false,
		configFile: false,
		presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
	});

	const testModule = new Module(filename, module);
	testModule.filename = filename;
	/* eslint-disable no-underscore-dangle */
	testModule.paths = Module._nodeModulePaths(path.dirname(filename));
	testModule._compile(code, filename);
	/* eslint-enable no-underscore-dangle */

	return testModule.exports;
};

const { addDelimiters, extractDelimiters } = loadEsmModule(
	'../../../static/scripts/ckeditor/plugins/ckeditor5-math/src/utils.js',
);

describe('ckeditor5-math utils', () => {
	describe('extractDelimiters', () => {
		const cases = [
			{
				name: 'reads an inline formula',
				stored: '\\( x^2 \\)',
				equation: 'x^2',
				display: false,
			},
			{
				name: 'reads a display formula',
				stored: '\\[ x^2 \\]',
				equation: 'x^2',
				display: true,
			},
			{
				name: 'reads a formula without surrounding whitespace',
				stored: '\\(\\sqrt{\\frac{a}{b}}\\)',
				equation: '\\sqrt{\\frac{a}{b}}',
				display: false,
			},
			{
				name: 'trims whitespace around the stored value',
				stored: '  \\( a+b \\)  ',
				equation: 'a+b',
				display: false,
			},
			{
				name: 'treats an undelimited value as an inline formula',
				stored: 'x^2',
				equation: 'x^2',
				display: false,
			},
			{
				name: 'does not mistake square brackets inside a formula for display mode',
				stored: '\\( [a,b] \\)',
				equation: '[a,b]',
				display: false,
			},
		];

		cases.forEach(({
			name, stored, equation, display,
		}) => {
			it(name, () => {
				expect(extractDelimiters(stored)).to.deep.equal({ equation, display });
			});
		});
	});

	describe('addDelimiters', () => {
		it('wraps an inline formula', () => {
			expect(addDelimiters('x^2', false)).to.equal('\\(x^2\\)');
		});

		it('wraps a display formula', () => {
			expect(addDelimiters('x^2', true)).to.equal('\\[x^2\\]');
		});
	});

	describe('round trip', () => {
		const equations = [
			'x^2',
			'\\sqrt{\\frac{a}{b}}',
			'\\int_0^\\infty e^{-x}\\,dx',
			'a \\cdot b = c',
			'[a,b]',
		];

		equations.forEach((equation) => {
			[false, true].forEach((display) => {
				it(`survives ${display ? 'display' : 'inline'}: ${equation}`, () => {
					expect(extractDelimiters(addDelimiters(equation, display))).to.deep.equal({
						equation,
						display,
					});
				});
			});
		});
	});
});
