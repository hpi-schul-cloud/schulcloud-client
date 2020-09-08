const stripHtml = require('string-strip-html');
const { SC_THEME } = require('../../config/global');

const ghostTheme = SC_THEME;

function fetchContent() {
	$(`.${ghostTheme}-blog .spinner`).show();
	$(`.${ghostTheme}-blog .placeholder`).hide();

	const themeUrl = ghostTheme === 'n21' ? '/ghost/startseite-nbc' : `/ghost/startseite-${ghostTheme}`;

	$.ajax({
		url: themeUrl,
		type: 'GET',
		dataType: 'json',
		contentType: 'application/json',
		timeout: 8000,
	})
		.done((result) => {
			$(`.${ghostTheme}-blog .title`).text(result.pages[0].title);
			$(`.${ghostTheme}-blog .content`).html(
				stripHtml(result.pages[0].html, {
					onlyStripTags: ['script', 'style'],
				}),
			);
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
