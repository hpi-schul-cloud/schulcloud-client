const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');

const renderMarkdown = (markdown) => sanitizeHtml(marked.parse(markdown));

const renderMarkdownWithImages = (markdown) => sanitizeHtml(marked.parse(markdown), {
	allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
	allowedAttributes: {
		...sanitizeHtml.defaults.allowedAttributes,
		img: ['src', 'alt', 'title'],
	},
});

module.exports = {
	renderMarkdown,
	renderMarkdownWithImages,
};
