const archiveDownload = (requestBody, selectedFileIds = []) => {
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

	if (selectedFileIds && selectedFileIds.length > 0) {
		selectedFileIds.forEach((selectedFileId) => {
			const selectedFilesInput = document.createElement('input');
			selectedFilesInput.type = 'hidden';
			selectedFilesInput.name = 'selectedFiles';
			selectedFilesInput.value = selectedFileId;
			form.appendChild(selectedFilesInput);
		});
	}

	form.appendChild(ownerIdInput);
	form.appendChild(ownerTypeInput);
	form.appendChild(archiveNameInput);

	document.body.appendChild(form);

	form.submit();
	form.remove();
};

function humanReadableFileSize(originalFilesize) {
	const bytesToMbytes = 1024 * 1024;
	const mb = originalFilesize / bytesToMbytes;
	const formated = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(mb);

	const result = `${formated} MB`;

	return result;
}

const convertToTree = (fileDocs) => {
	const tree = [];
	const lookup = {};

	fileDocs.forEach((file) => {
		lookup[file.id] = { ...file, children: [], humanReadableFileSize: humanReadableFileSize(file.size) };
	});

	fileDocs.forEach((file) => {
		if (file.parentId) {
			lookup[file.parentId].children.push(lookup[file.id]);
		} else {
			tree.push(lookup[file.id]);
		}
	});

	return tree;
};

export { archiveDownload, convertToTree, humanReadableFileSize };
