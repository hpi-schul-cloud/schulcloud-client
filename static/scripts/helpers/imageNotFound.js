const imageNotFound = () => {
	const images = $('.ck.ck-content.ck-editor__editable').find('img');
	for (const image of images) {
		$(image).on('error', function () {
			$(this).off('error')
				.attr('src', '/images/image-off-outline.svg')
				.attr('width', '125px')
				.attr('height', '125px');
		});
	}
};

export default imageNotFound;
