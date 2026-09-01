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
		it('reads an inline formula', () => {
			expect(extractDelimiters('\\( x^2 \\)')).to.deep.equal({
				equation: 'x^2',
				display: false,
			});
		});

		it('reads a display formula', () => {
			expect(extractDelimiters('\\[ x^2 \\]')).to.deep.equal({
				equation: 'x^2',
				display: true,
			});
		});

		it('reads a formula without surrounding whitespace', () => {
			expect(extractDelimiters('\\(\\sqrt{\\frac{a}{b}}\\)')).to.deep.equal({
				equation: '\\sqrt{\\frac{a}{b}}',
				display: false,
			});
		});

		it('trims whitespace around the stored value', () => {
			expect(extractDelimiters('  \\( a+b \\)  ')).to.deep.equal({
				equation: 'a+b',
				display: false,
			});
		});

		it('treats an undelimited value as an inline formula', () => {
			expect(extractDelimiters('x^2')).to.deep.equal({
				equation: 'x^2',
				display: false,
			});
		});

		it('does not mistake square brackets inside a formula for display mode', () => {
			expect(extractDelimiters('\\( [a,b] \\)')).to.deep.equal({
				equation: '[a,b]',
				display: false,
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
