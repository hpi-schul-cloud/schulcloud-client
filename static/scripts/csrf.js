function inIframe() {
	try {
		return window.self !== window.top;
	} catch (error) {
		return true;
	}
}

$('document').ready(() => {
	if (inIframe()) {
		$('.iframe').removeClass('hidden');
		$('.noiframe').addClass('hidden');
	}
});
