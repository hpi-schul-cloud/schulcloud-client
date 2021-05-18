window.addEventListener('load', () => {
	$('.userinfo').on('click', function click() {
		$(this).parent('.usersubmission.active').addClass('clicked');
		$('.usersubmission.active').removeClass('active');
		$(this).parent('.usersubmission:not(.clicked)').toggleClass('active');
		$('.usersubmission.clicked').removeClass('clicked');

		$('.usersubmission td:last-of-type i.fa-chevron-up').removeClass('fa-chevron-up').addClass('fa-chevron-down');
		$('.usersubmission.active td:last-of-type i.fa-chevron-down')
			.removeClass('fa-chevron-down').addClass('fa-chevron-up');
	});

	// change tab
	$('.tab-view>.tab-links>.tab-link').on('click', function click() {
		const range = $(this).closest('.tab-view');
		range.find('>.tab-links .tab-link.active').removeClass('active');
		$(this).addClass('active');
		range.find('>.tabs>.tab-content.active').removeClass('active');
		range.find(`>.tabs>#${this.id.replace('-tab-link', '')}.tab-content`).addClass('active');
	});


	// set initial tab-view by URL-Parameter
	function getParameterByName() {
		return decodeURIComponent(window.location.hash.replace('#activetabid=', ''));
	}

	if (getParameterByName('activetabid')) {
		const id = getParameterByName('activetabid');
		const range = $(`#${id}`).closest('.tab-view');
		range.find('>.tab-links .tab-link.active').removeClass('active');
		range.find('>.tabs>.tab-content.active').removeClass('active');

		range.find(`>.tab-links>#${id}-tab-link`).addClass('active');
		$(`#${id}`).addClass('active');
	}
});
