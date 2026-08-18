const archiveDownload = (requestBody) => {
	const form = document.createElement('form');
	form.method = 'GET';
	form.action = '/api/v1/filestorage/files/archive';
	form.target = '_blank';

	const ownerIdInput = document.createElement('input');
	ownerIdInput.type = 'hidden';
	ownerIdInput.name = 'ownerId';
	ownerIdInput.value = requestBody.ownerId;

	const ownerTypeInput = document.createElement('input');
	ownerTypeInput.type = 'hidden';
	ownerTypeInput.name = 'ownerType';
	ownerTypeInput.value = requestBody.ownerType;

	const archiveNameInput = document.createElement('input');
	archiveNameInput.type = 'hidden';
	archiveNameInput.name = 'archiveName';
	archiveNameInput.value = requestBody.archiveName;

	form.appendChild(ownerIdInput);
	form.appendChild(ownerTypeInput);
	form.appendChild(archiveNameInput);

	document.body.appendChild(form);
	console.log('Submitting form:', form.action);
	form.submit();
	form.remove();
};

const selectiveArchiveDownload = (queryParams) => {
	$.ajax({
		url: '/api/v1/filestorage/files/archive/file-list',
		method: 'GET',
		contentType: 'application/json',
		data: queryParams,
	}).done((response) => {
		console.log(response);
	}).fail((xhr) => {
		console.error(xhr.responseJSON?.message ? xhr.responseJSON?.message : 'error');
	});
};

export { archiveDownload, selectiveArchiveDownload };
