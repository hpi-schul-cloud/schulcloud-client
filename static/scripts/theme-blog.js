const stripHtml = require('string-strip-html');

const ghostTheme = $('#SC_THEME').text();

function fetchContent() {
	let finalHtml = '';

	$(`.${ghostTheme}-blog .spinner`).show();
	$(`.${ghostTheme}-blog .placeholder`).hide();

	const placeGhostOnPage = () => {
		finalHtml = $(finalHtml).children('code')[0].innerHTML;
		$(`.${ghostTheme}-blog .loading`).remove();
		$(`.${ghostTheme}-blog .content`).html(stripHtml(finalHtml,
			{ onlyStripTags: ['script', 'style'] }));
		$(`.${ghostTheme}-blog .content`).css('opacity', '1');
	};

	const themeUrl = ghostTheme === 'n21' ? '/ghost/startseite-nbc' : `/ghost/startseite-${ghostTheme}`;

	$.ajax({
		url: themeUrl,
		type: 'GET',
		dataType: 'json',
		contentType: 'application/json',
		timeout: 8000,
	})
		.done((result) => {
			finalHtml = result.pages[0].html;
			placeGhostOnPage();
		})
		.fail(() => {
			$(`.${ghostTheme}-blog .spinner`).hide();
			$(`.${ghostTheme}-blog .placeholder`).show();
		});
}

$(document).ready(() => {
	fetchContent();
	$(`.${ghostTheme}-blog .placeholder button`).on('click', fetchContent);
});
