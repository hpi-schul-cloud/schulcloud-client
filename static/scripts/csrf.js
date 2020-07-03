function inIframe() {
	try {
		return window.self !== window.top;
	} catch (e) {
		return true;
	}
}
$('document').ready(() => {
	const retrybtn = $('#retrybtn');
	retrybtn.html($t('global.button.tryAgain'));
	if (inIframe()) {
		$('.iframe').removeClass('hidden');
		$('.noiframe').addClass('hidden');
	}
	retrybtn.click(() => {
		$('#retryform').submit();
	});
});
