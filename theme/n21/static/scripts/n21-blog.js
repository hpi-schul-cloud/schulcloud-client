const stripHtml = require('string-strip-html');

$(document).ready(() => {
	
	$.ajax({
		url: '/ghost/startseite-nbc',
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
