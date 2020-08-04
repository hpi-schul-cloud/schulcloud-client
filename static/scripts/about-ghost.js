const stripHtml = require('string-strip-html');

function fetchContent() {
	let finalHtml;
	$('.ghost .spinner').show();
	$('.ghost .placeholder').hide();

	$.ajax({
		url: '/ghost/landing-page-about/',
		type: 'GET',
		dataType: 'json',
		contentType: 'application/json',
		timeout: 8000,
		async: false,
	})
		.then((result) => {
			$('.ghost .loading').remove();
			finalHtml = result.pages[0].html;
			finalHtml = finalHtml
				.replace(/<td>x<[/]td>/g, '<td><i class="fa fa-check"></i></td>');
			$('.ghost .content').html(stripHtml(finalHtml,
				{ onlyStripTags: ['script', 'style'] }));
			$('.ghost .content').css('opacity', '1');
		})
		.fail(() => {
			$('.ghost .spinner').hide();
			$('.ghost .placeholder').show();
		});
}

$(document).ready(() => {
	fetchContent();
	$('.ghost .placeholder button').on('click', fetchContent);
});
