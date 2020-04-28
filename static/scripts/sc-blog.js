const stripHtml = require('string-strip-html');

function fetchContent() {
	$('.sc-blog .spinner').show();
	$('.sc-blog .placeholder').hide();

	$.ajax({
		url: '/ghost/startseite-hpi-schul-cloud',
		type: 'GET',
		dataType: 'json',
		contentType: 'application/json',
		timeout: 8000,
	})
		.done((result) => {
			$('.sc-blog .title').text(result.pages[0].title);
			result.pages[0].html = result.pages[0].html
				.replace(/<td>x<[/]td>/g, '<td><i class="fa fa-check"></i></td>');
			$('.sc-blog .content').html(stripHtml(result.pages[0].html, { onlyStripTags: ['script', 'style'] }));
		})
		.fail(() => {
			$('.sc-blog .spinner').hide();
			$('.sc-blog .placeholder').show();
		});
}

$(document).ready(() => {
	fetchContent();
	$('.sc-blog .placeholder button').on('click', fetchContent);
});
