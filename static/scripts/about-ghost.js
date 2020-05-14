const stripHtml = require('string-strip-html');

function fetchContent() {
	let finalHtml = '';
	$('.ghost .spinner').show();
	$('.ghost .placeholder').hide();

	const Array = [
		'/ghost/herzlich-willkommen/',
		'/ghost/explanatory-video/',
		'/ghost/what-matters/',
	];

	const changePage = () => {
		finalHtml = finalHtml
			.replace(/<td>x<[/]td>/g, '<td><i class="fa fa-check"></i></td>');
		$('.ghost .content').html(stripHtml(finalHtml,
			{ onlyStripTags: ['script', 'style'] }));
		$('.ghost .content').css('opacity', '1');
	};

	const promiseFunc = new Promise((resolve, reject) => {
		Array.forEach((url, index) => {
			$.ajax({
				url,
				type: 'GET',
				dataType: 'json',
				contentType: 'application/json',
				timeout: 8000,
				async: false,
			})
				.then((result) => {
					finalHtml += result.pages[0].html;
					$('.ghost .loading').remove();
					if (index === Array.length - 1) {
						resolve();
					}
				})
				.fail(() => {
					$('.ghost .spinner').hide();
					$('.ghost .placeholder').show();
				});
		});
	});
	promiseFunc.then(() => {
		changePage();
	});
}

$(document).ready(() => {
	fetchContent();
	$('.ghost .placeholder button').on('click', fetchContent);
});
