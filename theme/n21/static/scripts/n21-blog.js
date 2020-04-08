const initialized = false;
$(document).ready(() => {
	if (initialized) {
		return;
	}

	function sanitize(input) {
		const output = input.replace(/<script[^>]*?>.*?<\/script>/gi, '')
			.replace(/<style[^>]*?>.*?<\/style>/gi, '')
			.replace(/<![\s\S]*?--[ \t\n\r]*>/gi, '')
			.replace(/&nbsp;/g, '');
		return output;
	}

	const contentKey = document.querySelector('script[data-contentkey]').dataset.contentkey;

	$.ajax({
		url: 'https://blog.niedersachsen.cloud/ghost/api/v2/content/pages/slug/startseite-nbc/',
		data: {
			key: contentKey,
			fields: 'html,title',
		},
		type: 'GET',
		dataType: 'json',
		contentType: 'application/json',
		timeout: 8000,
	})
		.done((result) => {
			$('.n21-blog .title').text(result.pages[0].title);
			$('.n21-blog .context').html(sanitize(result.pages[0].html));
		})
		.fail(() => {
			console.error('Could not load frontpage content from blog');
		});
});
