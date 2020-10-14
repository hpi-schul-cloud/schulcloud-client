$(document).ready(() => {
	$('#news-form').on('submit', (e) => {
		if ($('input[name=title]').val().length === 0) {
			$.showNotification($t('news.text.newsNeedTitle'), 'danger', 10000);
			e.preventDefault();
		}
	});
});
