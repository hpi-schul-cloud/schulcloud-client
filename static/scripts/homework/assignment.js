window.addEventListener('load', () => {
	$('.userinfo').on('click', function click() {
		$(this).parent('.usersubmission.active').addClass('clicked');
		$('.usersubmission.active').removeClass('active');
		$(this).parent('.usersubmission:not(.clicked)').toggleClass('active');
		$('.usersubmission.clicked').removeClass('clicked');

		$('.usersubmission td:last-of-type i.fa-chevron-up').removeClass('fa-chevron-up').addClass('fa-chevron-down');
		$('.usersubmission.active td:last-of-type i.fa-chevron-down')
			.removeClass('fa-chevron-down').addClass('fa-chevron-up');

		const userInfoId = $(this).parent('.usersubmission').attr('id');
		const urlWithParams = window.location.href.replace('#', '?');
		const actualId = new URL(urlWithParams).searchParams.get('submissionId');
		const url = window.location.pathname;
		if (actualId) {
			if (actualId === userInfoId) {
				window.location = `${url}#activetabid=submissions`;
			}
		} else if (userInfoId) {
			window.location = `${url}#activetabid=submissions&submissionId=${userInfoId}`;
		}
	});

	// change tab
	$('.tab-view>.tab-links>.tab-link').on('click', function click() {
		const range = $(this).closest('.tab-view');
		range.find('>.tab-links .tab-link.active').removeClass('active');
		$(this).addClass('active');
		range.find('>.tabs>.tab-content.active').removeClass('active');
		range.find(`>.tabs>#${this.id.replace('-tab-link', '')}.tab-content`).addClass('active');
		const activeSubmissionTabId = $(this).attr('id');
		if (activeSubmissionTabId === 'submission-tab-link' || activeSubmissionTabId === 'comment-tab-link') {
			const urlWithParams = new URL(window.location.href.replace('#', '?'));
			if (urlWithParams.searchParams.get('activeSubmissionTabId')) {
				urlWithParams.searchParams.set('activeSubmissionTabId', activeSubmissionTabId);
			} else {
				urlWithParams.searchParams.append('activeSubmissionTabId', activeSubmissionTabId);
			}
			window.location = urlWithParams.href.replace('?', '#');
		}
	});

	const urlWithParams = new URL(window.location.href.replace('#', '?'));
	if (urlWithParams.searchParams.get('activetabid')) {
		const id = urlWithParams.searchParams.get('activetabid');
		const range = $(`#${id}`).closest('.tab-view');
		range.find('>.tab-links .tab-link.active').removeClass('active');
		range.find('>.tabs>.tab-content.active').removeClass('active');

		range.find(`>.tab-links>#${id}-tab-link`).addClass('active');
		$(`#${id}`).addClass('active');

		if (urlWithParams.searchParams.get('submissionId')) {
			const userInfoId = urlWithParams.searchParams.get('submissionId');

			$(`#${userInfoId}`).addClass('active');

			if (urlWithParams.searchParams.get('activeSubmissionTabId')) {
				const activeSubmissionTabId = urlWithParams.searchParams.get('activeSubmissionTabId');

				$(`#${activeSubmissionTabId}`).addClass('active');
			}
		}
	}
});
