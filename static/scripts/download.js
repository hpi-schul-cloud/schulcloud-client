const appendHiddenInput = (form, name, value) => {
	const input = document.createElement('input');
	input.type = 'hidden';
	input.name = name;
	input.value = value;
	form.appendChild(input);
};

const archiveDownload = (requestBody, selectedFileIds = []) => {
	const form = document.createElement('form');
	form.method = 'POST';
	form.action = '/api/v1/filestorage/files/archive';
	form.target = '_blank';
	form.rel = 'noopener';

	const csrfTokenMetaTag = document.querySelector('meta[name="csrfToken"]');
	if (csrfTokenMetaTag) {
		appendHiddenInput(form, '_csrf', csrfTokenMetaTag.getAttribute('content'));
	}

	appendHiddenInput(form, 'ownerId', requestBody.ownerId);
	appendHiddenInput(form, 'ownerType', requestBody.ownerType);
	appendHiddenInput(form, 'archiveName', requestBody.archiveName);

	if (selectedFileIds && selectedFileIds.length > 0) {
		selectedFileIds.forEach((selectedFileId) => {
			appendHiddenInput(form, 'selectedFiles', selectedFileId);
		});
	}

	document.body.appendChild(form);

	form.submit();
	form.remove();
};

export default archiveDownload;
