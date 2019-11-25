function inIframe() {
	try {
		return window.self !== window.top;
	} catch (e) {
		return true;
	}
}
$('document').ready(() => {
	if (inIframe()) {
		$('.iframe').removeClass('hidden');
		$('.noiframe').addClass('hidden');
	}
});
