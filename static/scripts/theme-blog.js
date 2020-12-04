const stripHtml = require('string-strip-html');

const ghostTheme = $('#SC_THEME').text();

const fetchContent = () => {
	$(`.${ghostTheme}-blog .spinner`).show();
	$(`.${ghostTheme}-blog .placeholder`).hide();

	const placeGhostOnPage = (ghostHtml) => {
		$(`.${ghostTheme}-blog .loading`).remove();
		const ghostContent = $(ghostHtml).children('code').length > 0 ? $(ghostHtml).children('code')[0].innerHTML
			: ghostHtml;
		$(`.${ghostTheme}-blog .content`).html(stripHtml(ghostContent,
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
			placeGhostOnPage(result.pages[0].html);
		})
		.fail(() => {
			$(`.${ghostTheme}-blog .spinner`).hide();
			$(`.${ghostTheme}-blog .placeholder`).show();
		});
};

$(document).ready(() => {
	fetchContent();
	$(`.${ghostTheme}-blog .placeholder button`).on('click', fetchContent);
});
