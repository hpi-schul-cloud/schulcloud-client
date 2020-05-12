const stripHtml = require('string-strip-html');
const { Configuration } = require('@schul-cloud/commons');


function fetchContent() {
	$('.sc-blog .spinner').show();
	$('.sc-blog .placeholder').hide();

	if (Configuration.has('GHOST_PAGES_URLS')) {
		const Array2 = Configuration.get('GHOST_API_URL');

		Array2.map((url) => {
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
					result.pages[0].html = result.pages[0].html
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
}

$(document).ready(() => {
	fetchContent();
	$('.sc-blog .placeholder button').on('click', fetchContent);
});
