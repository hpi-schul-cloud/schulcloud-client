const Handlebars = require('handlebars');
const { expect } = require('chai');
const { decode } = require('html-entities');
const i18n = require('../../../helpers/i18n');
const helpers = require('../../../helpers/handlebars/helpers')();
const { decodeCourseName } = require('../../../controllers/courses');

const archivedHeadlineTemplate = '{{$t "courses._course.edit.headline.courseIsArchieved"'
	+ ' (dict "coursename" course.name)}}';

describe('edit-course archived headline', () => {
	let renderHeadline;

	before(async () => {
		await i18n.changeLanguage('en');
		Handlebars.registerHelper('$t', helpers.$t);
		Handlebars.registerHelper('dict', helpers.dict);
		const template = Handlebars.compile(archivedHeadlineTemplate);
		renderHeadline = (name) => template(
			{ course: { name } },
			{ data: { local: { currentUser: {} } } },
		);
	});

	it('should display ">" in course names instead of a double-escaped entity', () => {
		const html = renderHeadline('Transformation Oil => Electricity');

		expect(decode(html)).to.include('Transformation Oil => Electricity');
		expect(html).to.not.include('&amp;gt;');
	});

	[
		'Abc < Def',
		'two > one',
	].forEach((name) => {
		it(`should display literal comparison characters in archived headline: ${name}`, () => {
			const html = renderHeadline(name);

			expect(decode(html)).to.include(name);
			expect(html).to.not.include('&amp;lt;');
			expect(html).to.not.include('&amp;gt;');
		});
	});

	it('should still escape XSS payloads in interpolated course names', () => {
		const html = renderHeadline('<script>alert(1)</script>');

		expect(html).to.include('&lt;script&gt;');
		expect(html).to.not.include('<script>');
	});

	it('should not double-encode names stored as HTML entities in the database', () => {
		const html = renderHeadline(
			decodeCourseName('Transformation Oil =&gt; Electricity'),
		);

		expect(decode(html)).to.include('Transformation Oil => Electricity');
		expect(html).to.not.include('&amp;gt;');
	});
});
