import { resizeIframes } from './helpers/iFrameResize';

resizeIframes();

$(document).on('pageload', () => {
	if (window.renderMathInElement) window.renderMathInElement(document.body, { throwOnError: false });
});
