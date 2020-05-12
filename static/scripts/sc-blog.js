const stripHtml = require('string-strip-html');

function fetchContent() {
	console.log('hoho')

	$('.sc-blog .spinner').show();
	$('.sc-blog .placeholder').hide();

	const Array = [
		'https://blog.schul-cloud.org/herzlich-willkommen/',
		'https://blog.schul-cloud.org/explanatory-video/',
	];

	Array.forEach((url) => {
		console.log('hoho');

		$.ajax({
			url,
			type: 'GET',
			dataType: 'json',
			contentType: 'application/json',
			timeout: 8000,
		})
			.done((result) => {
				console.log(result);
				$('.sc-blog .loading').remove();
				$('.sc-blog .title').text(result.pages[0].title);
				result.pages[0].html += result.pages[0].html
					.replace(/<td>x<[/]td>/g, '<td><i class="fa fa-check"></i></td>');
				$('.sc-blog .content').html(stripHtml(result.pages[0].html,
					{ onlyStripTags: ['script', 'style'] }));
				$('.sc-blog .content').css('opacity', '1');
			})
			.fail(() => {
				$('.sc-blog .spinner').hide();
				$('.sc-blog .placeholder').show();
			});
	});
}

$(document).ready(() => {
	console.log('hoho')
	fetchContent();
	$('.sc-blog .placeholder button').on('click', fetchContent);
});
