const stripHtml = require('string-strip-html');

$(document).ready(() => {
	const contentApiKey = document.querySelector('script[data-content-key-n21-blog]').dataset.contentKeyN21Blog;

	$.ajax({
		url: 'https://blog.niedersachsen.cloud/ghost/api/v2/content/pages/slug/startseite-nbc/',
		data: {
			key: contentApiKey,
			fields: 'html,title',
		},
		type: 'GET',
		dataType: 'json',
		contentType: 'application/json',
		timeout: 8000,
	})
		.done((result) => {
			$('.n21-blog .title').text(result.pages[0].title);
			$('.n21-blog .content').html(stripHtml(result.pages[0].html, { onlyStripTags: ['script', 'style'] }));
		})
		.fail(() => {
			/* eslint-disable-next-line */
			console.error('Could not load frontpage content from blog');
		});
});
