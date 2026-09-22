const { expect } = require('chai');
const { renderMarkdown } = require('../../../helpers/markdown');

describe('markdown helper', () => {
	describe('renderMarkdown', () => {
		it('should render basic markdown to html', () => {
			const result = renderMarkdown('# Hello\n\nThis is **bold**.');
			expect(result).to.include('<h1>Hello</h1>');
			expect(result).to.include('<strong>bold</strong>');
		});

		it('should render tables', () => {
			const result = renderMarkdown('| Header |\n| --- |\n| Cell |');
			expect(result).to.include('<table>');
			expect(result).to.include('<th>Header</th>');
			expect(result).to.include('<td>Cell</td>');
		});

		it('should strip inline html including xss payloads', () => {
			const result = renderMarkdown('<img src=x onerror=alert(1)>');
			expect(result).to.not.include('<img');
			expect(result).to.not.include('onerror');
		});

		it('should escape html inside code blocks', () => {
			const result = renderMarkdown('```html\n<script>alert("xss")</script>\n```');
			expect(result).to.include('&lt;script&gt;');
			expect(result).to.not.include('<script>');
		});
	});
});
