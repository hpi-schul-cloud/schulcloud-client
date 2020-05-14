const stripHtml = require('string-strip-html');

let production;

function fetchContent() {
	let finalHtml = '';
	$('.sc-blog .spinner').show();
	$('.sc-blog .placeholder').hide();

	const Array = [
		'/ghost/herzlich-willkommen/',
		'/ghost/explanatory-video/',
		'/ghost/what-matters/',
	];

	const changePage = () => {
		$('.sc-blog .loading').remove();
		finalHtml = finalHtml
			.replace(/<td>x<[/]td>/g, '<td><i class="fa fa-check"></i></td>');
		$('.sc-blog .content').html(stripHtml(finalHtml,
			{ onlyStripTags: ['script', 'style'] }));
		$('.sc-blog .content').css('opacity', '1');
	};

	const promiseFunc = new Promise((resolve) => {
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
					if (index === Array.length - 1) {
						resolve();
					}
				})
				.fail(() => {
					$('.sc-blog .spinner').hide();
					$('.sc-blog .placeholder').show();
				});
		});
	});
	promiseFunc.then(() => {
		changePage();
	});
}

$(document).ready(() => {
	({ production } = window);
	fetchContent();
	$('.sc-blog .placeholder button').on('click', fetchContent);
});
