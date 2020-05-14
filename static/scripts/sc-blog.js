const stripHtml = require('string-strip-html');

let production;
let linksArray;

function fetchContent() {
	let finalHtml = '';
	$('.sc-blog .spinner').show();
	$('.sc-blog .placeholder').hide();

	const changePage = () => {
		$('.sc-blog .loading').remove();
		finalHtml = finalHtml
			.replace(/<td>x<[/]td>/g, '<td><i class="fa fa-check"></i></td>');
		$('.sc-blog .content').html(stripHtml(finalHtml,
			{ onlyStripTags: ['script', 'style'] }));
		$('.sc-blog .content').css('opacity', '1');
	};

	const promiseFunc = new Promise((resolve) => {
		$.ajax({
			url: 'landing-pag/',
			type: 'GET',
			dataType: 'json',
			contentType: 'application/json',
			timeout: 8000,
		})
			.then((result) => {
				const regexHash = /\#{1}[a-zA-Z--]+/g;
				const regexAsterisk = /\~{1}[a-zA-Z--]+/g;
				if (production) {
					linksArray = result.pages[0].html.match(regexHash);
				} else {
					linksArray = result.pages[0].html.match(regexAsterisk);
				}
				resolve();
			})
			.fail(() => {
				finalHtml = '<h2 class="section-title title text-center'
					+ 'style="color: var(--color-primary);">Failed to load data from ghost/landing-page/</h2>';
				changePage();
			});
	});

	promiseFunc
		.then(() => {
			linksArray.forEach((url, index) => {
				url = url.substr(1);
				$.ajax({
					url: `/ghost/${url}/`,
					type: 'GET',
					dataType: 'json',
					contentType: 'application/json',
					timeout: 8000,
					async: false,
				})
					.then((result) => {
						finalHtml += result.pages[0].html;
						if (index === linksArray.length - 1) {
							changePage();
						}
					})
					.fail(() => {
						$('.sc-blog .spinner').hide();
						$('.sc-blog .placeholder').show();
					});
			});
		});
}


$(document).ready(() => {
	({ production } = window);
	fetchContent();
	$('.sc-blog .placeholder button').on('click', fetchContent);
});
