const stripHtml = require('string-strip-html');

function fetchContent() {
	$('.n21-blog .spinner').show();
	$('.n21-blog .placeholder').hide();

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
			$('.n21-blog .spinner').hide();
			$('.n21-blog .placeholder').show();
		});
}

$(document).ready(() => {
	fetchContent();
	$('.n21-blog .placeholder button').on("click", fetchContent);
});
