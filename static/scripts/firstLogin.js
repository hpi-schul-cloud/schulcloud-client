$('.btn-scroll').click(() => {
	$('html,body').animate({ scrollTop: $('#information').offset().top - 100 },
		'slow');
});
