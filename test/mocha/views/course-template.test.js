const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { expect } = require('chai');

const courseTemplate = fs.readFileSync(
	path.join(__dirname, '../../../views/courses/course.hbs'),
	'utf8',
);

describe('course template', () => {
	it('renders course names as escaped text', () => {
		const payload = '<img src=x onerror=alert(1)>';
		const nameExpressions = courseTemplate.match(/\{\{\.\.\/name\}\}/g);
		const renderedName = Handlebars.compile('{{#each values}}{{../name}}{{/each}}')({
			name: payload,
			values: [true],
		});

		expect(nameExpressions).to.have.length(2);
		expect(renderedName).to.equal(Handlebars.escapeExpression(payload));
		expect(renderedName).to.include('&lt;img');
		expect(renderedName).to.not.include('<img');
	});
});
