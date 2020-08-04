const stripHtml = require('string-strip-html');
const Handlebars = require('handlebars');

function fetchBlogs() {
	$('.blog-cards .spinner').show();

	$.ajax({
		url: '/blog',
		type: 'GET',
		dataType: 'json',
		contentType: 'application/json',
		timeout: 8000,
	})
		.done((blogFeed) => {
			const template = $('#blog-entries').html();
			const blogsRender = Handlebars.compile(template);
			document.getElementsByClassName('blog-cards')[0]
				.innerHTML = blogsRender({ ...blogFeed });
		});
}

function callBlogFetching() {
	const blogContent = $('.blog-cards');
	const blogContentTop = blogContent.offset().top;

	if (($(window).scrollTop() + $(window).height() >= blogContentTop)) {
		fetchBlogs();
		$(window).off('scroll', callBlogFetching);
	}
}

$(document).ready(() => {
	Handlebars.registerPartial('blog-card', $('#blog-card').html());
	Handlebars.registerHelper('stripHTMLTags', (htmlText) => stripHtml(htmlText));
	Handlebars.registerHelper('truncatePure', (text, length) => {
		if (text.length <= length) {
			return text;
		}
		const subString = text.substr(0, length - 1);
		return `${subString}...`;
	});
	$(window).scroll(callBlogFetching);
});
