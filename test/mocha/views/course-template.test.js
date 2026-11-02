const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { expect } = require('chai');
const { decode } = require('html-entities');
const handlebarsHelpers = require('../../../helpers/handlebars/helpers')();
const {
	ensureHasNoAsciiControlChar,
} = require('../../../controllers/courses');

const courseTemplate = fs.readFileSync(
	path.join(__dirname, '../../../views/courses/course.hbs'),
	'utf8',
);

Handlebars.registerHelper('decodeHtmlEntities', handlebarsHelpers.decodeHtmlEntities);

const renderCourseName = (name) => Handlebars.compile(
	'{{decodeHtmlEntities name}}',
)({
	name,
});

const xssPayloads = [
	'<script>alert(1)</script>',
	'<img src=x onerror=alert(1)>',
	'<svg onload=alert(1)>',
	'"><script>alert(1)</script>',
];

const escapedCourseNameExpression = /\{\{decodeHtmlEntities \.\.\/name\}\}/;
const unescapedCourseNameExpression = /\{\{\{decodeHtmlEntities \.\.\/name\}\}\}/;
const allEscapedCourseNameExpressions = /\{\{decodeHtmlEntities \.\.\/name\}\}/g;
const unescapedHtmlTag = /<(script|img|svg|a)\b/i;

describe('course template', () => {
	it('should use escaped Handlebars expressions for course names', () => {
		expect(courseTemplate).to.match(escapedCourseNameExpression);
		expect(courseTemplate).to.not.match(unescapedCourseNameExpression);
		expect(
			courseTemplate.match(allEscapedCourseNameExpressions),
		).to.have.length(2);
	});

	it('should render course names as escaped text', () => {
		const payload = '<img src=x onerror=alert(1)>';
		const renderedName = renderCourseName(payload);

		expect(renderedName).to.equal(Handlebars.escapeExpression(payload));
		expect(renderedName).to.include('&lt;img');
		expect(renderedName).to.not.include('<img');
	});

	xssPayloads.forEach((payload) => {
		it(`should escape XSS payload so it cannot execute: ${payload}`, () => {
			const renderedName = renderCourseName(payload);

			expect(renderedName).to.equal(Handlebars.escapeExpression(payload));
			expect(renderedName).to.not.match(unescapedHtmlTag);
		});
	});

	it('should escape normalized course names that contain markup', () => {
		const raw = '  <script>alert(1)</script> <img src=x onerror=alert(1)>  ';
		const normalized = ensureHasNoAsciiControlChar(raw);
		const renderedName = renderCourseName(normalized);

		expect(normalized).to.equal(
			'<script>alert(1)</script> <img src=x onerror=alert(1)>',
		);
		expect(renderedName).to.equal(Handlebars.escapeExpression(normalized));
		expect(renderedName).to.include('&lt;script&gt;');
		expect(renderedName).to.include('&lt;img');
		expect(renderedName).to.not.include('<script>');
		expect(renderedName).to.not.include('<img');
	});

	it('should not double-encode names stored as HTML entities in the database', () => {
		const fromDatabase = 'Transformation Oil =&gt; Electricity';
		const renderedName = renderCourseName(fromDatabase);

		expect(renderedName).to.not.include('&amp;gt;');
		expect(decode(renderedName)).to.include('Transformation Oil => Electricity');
	});

	[
		'Abc < Def',
		'two > one',
	].forEach((name) => {
		it(`should render literal comparison characters as text: ${name}`, () => {
			const renderedName = renderCourseName(name);

			expect(renderedName).to.equal(Handlebars.escapeExpression(name));
			expect(renderedName).to.not.include('&amp;lt;');
			expect(renderedName).to.not.include('&amp;gt;');
			expect(decode(renderedName)).to.equal(name);
		});
	});

	it('should not render decoded database names as HTML', () => {
		const fromDatabase = '&lt;script&gt;alert(1)&lt;/script&gt;';
		const renderedName = renderCourseName(fromDatabase);

		expect(renderedName).to.include('&lt;script&gt;');
		expect(renderedName).to.not.match(unescapedHtmlTag);
	});
});
