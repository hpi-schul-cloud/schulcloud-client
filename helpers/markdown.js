const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');

const renderMarkdown = (markdown) => sanitizeHtml(marked.parse(markdown));

module.exports = {
	renderMarkdown,
};
