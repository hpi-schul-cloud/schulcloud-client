import $ from 'jquery';

import { createParent } from '../helpers/homework';
import { apiV3FileStorageBasePath, getFileDownloadUrl } from '../helpers/storage';

/**
 * Creates a CKEditor 5 FileBrowser adapter for the schulcloud-client file browser.
 *
 * The adapter opens the existing jQuery/Bootstrap modal (`.ckeditor-filebrowser-dialog`)
 * and the server file picker popup used by the legacy CKEditor 4 file browser plugin.
 * It resolves the selected file URL through the legacy copy/upload flow and returns
 * a shape compatible with the FileBrowserAdapter interface from `@hpi-schul-cloud/ckeditor`.
 */

let activeAdapter = null;

async function copyFile(schoolId, parentType, parentId, url) {
	const urlParams = new URLSearchParams(url.split('?')[1]);
	const fileId = urlParams.get('file');
	const fileName = urlParams.get('name');

	if (!fileName) {
		return undefined;
	}

	const signedUrlResponse = await $.ajax({
		url: `${window.location.origin}/files/signedurl?file=${fileId}&name=${fileName}`,
		method: 'GET',
	});

	const fileRecord = await $.ajax(
		`${apiV3FileStorageBasePath}/upload-from-url/school/${schoolId}/${parentType}/${parentId}`,
		{
			method: 'POST',
			data: {
				url: signedUrlResponse.url,
				fileName,
			},
		},
	);

	return getFileDownloadUrl(fileRecord.id, fileRecord.name);
}

async function resolveFileUrl(sourceElement, courseFileUrl) {
	let parentId = sourceElement.getAttribute('data-parent-id');
	const parentType = sourceElement.getAttribute('data-parent-type');
	const schoolId = sourceElement.getAttribute('data-school-id');
	const homeworkId = sourceElement.getAttribute('data-homework-id');

	if (parentId === '') {
		parentId = await createParent(parentType);

		sourceElement.setAttribute('data-parent-id', parentId);
		$('.section-upload').attr('data-parent-id', parentId);

		if (parentType === 'submissions' || parentType === 'gradings') {
			const referrer = `/homework/${homeworkId}#activetabid=submission`;
			$('input[name="referrer"]').val(referrer);
		} else {
			const referrer = `/homework/${parentId}`;
			$('input[name="referrer"]').val(referrer);
		}
	}

	if (parentId !== undefined && schoolId !== undefined && parentType !== undefined) {
		return copyFile(schoolId, parentType, parentId, courseFileUrl);
	}

	return courseFileUrl;
}

function createFileBrowserModal(dialogTitle, additionalInput, onSubmit) {
	const ckeditorFilebrowserDialog = $('.ckeditor-filebrowser-dialog');

	populateModalForm(ckeditorFilebrowserDialog, {
		title: dialogTitle,
		closeLabel: 'Cancel',
		submitLabel: 'OK',
		submitDataTestId: 'file-browser-modal',
	});

	const dialogContent = `<label for="url-input" style="display: none">URL:</label>
		<input type="hidden" id="url-input">
		<input type="hidden" id="editor-id">
		<button type="button" id="browseServerButton">Browse Server</button><br>${additionalInput}`;

	ckeditorFilebrowserDialog.find('.modal-body').html(dialogContent);
	ckeditorFilebrowserDialog.find('.btn-submit').on('click', async () => {
		ckeditorFilebrowserDialog.modal('hide');
		await onSubmit();
		ckeditorFilebrowserDialog.find('.btn-submit').off('click');
	});

	ckeditorFilebrowserDialog.appendTo('body').modal('show');

	document.getElementById('editor-id').value = activeAdapter?.id ?? '';

	const messageHandler = (e) => {
		if (e.origin !== window.location.origin) {
			return;
		}

		document.getElementById('url-input').value = e.data;
	};
	window.addEventListener('message', messageHandler);

	ckeditorFilebrowserDialog.find('#browseServerButton').on('click', () => {
		const dialogPageUrl = `${activeAdapter?.browseUrl}?CKEditor=true`;
		window.open(dialogPageUrl, '_blank', 'width=700, height=500');
	});

	ckeditorFilebrowserDialog.one('hidden.bs.modal', () => {
		window.removeEventListener('message', messageHandler);
	});
}

export default function createFileBrowserAdapter(sourceElement, browseUrl) {
	const adapter = {
		id: window.crypto.randomUUID(),
		sourceElement,
		browseUrl,

		async pickImage() {
			activeAdapter = adapter;

			const additionalInput = `<br><label for="alt-text-input">Alternative Text:</label>
				<input type="text" id="alt-text-input">`;

			return new Promise((resolve) => {
				createFileBrowserModal('Image Properties', additionalInput, async () => {
					const courseFileUrl = document.getElementById('url-input').value;
					const imageUrl = await resolveFileUrl(adapter.sourceElement, courseFileUrl);

					if (!imageUrl) {
						resolve(null);
						return;
					}

					const lastOpenedAdapterId = document.getElementById('editor-id').value;
					if (lastOpenedAdapterId !== adapter.id) {
						resolve(null);
						return;
					}

					const alt = document.getElementById('alt-text-input').value;
					resolve({ url: imageUrl, alt });
				});
			});
		},

		async pickVideo() {
			activeAdapter = adapter;

			return new Promise((resolve) => {
				createFileBrowserModal('Video Properties', '', async () => {
					const courseFileUrl = document.getElementById('url-input').value;
					const videoUrl = await resolveFileUrl(adapter.sourceElement, courseFileUrl);

					if (!videoUrl) {
						resolve(null);
						return;
					}

					const lastOpenedAdapterId = document.getElementById('editor-id').value;
					if (lastOpenedAdapterId !== adapter.id) {
						resolve(null);
						return;
					}

					resolve({ url: videoUrl });
				});
			});
		},

		async pickAudio() {
			activeAdapter = adapter;

			return new Promise((resolve) => {
				createFileBrowserModal('Audio Properties', '', async () => {
					const courseFileUrl = document.getElementById('url-input').value;
					const audioUrl = await resolveFileUrl(adapter.sourceElement, courseFileUrl);

					if (!audioUrl) {
						resolve(null);
						return;
					}

					const lastOpenedAdapterId = document.getElementById('editor-id').value;
					if (lastOpenedAdapterId !== adapter.id) {
						resolve(null);
						return;
					}

					resolve({ url: audioUrl });
				});
			});
		},
	};

	return adapter;
}
