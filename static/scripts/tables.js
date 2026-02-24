$(document).ready(() => {
	$('#limit').change(() => {
		let location = window.location.search.split('&');
		let contained = false;

		location = location.map((entity) => {
			if (entity.includes('limit')) {
				entity = `limit=${$('#limit').val()}`;
				contained = true;
			}
			return entity;
		});
		if (!contained) location.push(`limit=${$('#limit').val()}`);
		window.location.search = location.join('&');
	});
});
