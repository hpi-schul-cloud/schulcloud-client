$('.base64File-download-btn').on('click', (e) => {
	e.preventDefault();
	$.getJSON(e.currentTarget.href, (result) => {
		const downloadLink = document.createElement('a');
		downloadLink.href = result;
		downloadLink.download = e.target.title;
		downloadLink.click();
	});
});
