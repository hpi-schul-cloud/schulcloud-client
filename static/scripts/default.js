window.schulcloudColors = {
	primaryColor: $('.primary-color').first().css('color'),
	secondaryColor: $('.secondary-color').first().css('color'),
};

$("meta[name='theme-color']")
	.first()
	.attr('content', window.schulcloudColors.secondaryColor);
$("meta[name='apple-mobile-web-app-status-bar-style']")
	.first()
	.attr('content', window.schulcloudColors.secondaryColor);
$("link[rel='mask-item']")
	.first()
	.attr('content', window.schulcloudColors.primaryColor);
