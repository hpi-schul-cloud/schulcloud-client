$('.user-language-change').on('click', function createInvitation(e) {
	e.stopPropagation();
	e.preventDefault();
	const language = `${$(this).attr('data-href')}language`; // add data-href

	$.ajax({
		type: 'PATCH',
		url: '/user/language',
		beforeSend(xhr) {
			xhr.setRequestHeader('Csrf-Token', csrftoken);
		},
		data: {
			language,
		},
		success(data) {
			// do fancy ux stuff

		},
	});
});
