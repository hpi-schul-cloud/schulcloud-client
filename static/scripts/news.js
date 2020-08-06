$(document).ready(() => {
	$('#news-form').on('submit', (e) => {
		e.preventDefault();
		if ($('input[name=title]').val().length === 0) {
			$.showNotification($t('news.text.newsNeedTitle'), 'danger', 10000);
		} else {
			this.submit();
		}
	});
});
