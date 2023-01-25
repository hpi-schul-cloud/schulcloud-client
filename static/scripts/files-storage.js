import { apiV3FileStorageBasePath, getFileDownloadUrl } from './helpers/storage';

const errorMessages = {
	FILE_NAME_EMPTY: 'files._file.text.fileNameEmpty',
	FILE_NAME_EXISTS: 'files._file.text.fileNameExists',
	FILE_IS_BLOCKED: 'files._file.text.fileIsBlocked',
	FILE_NOT_FOUND: 'files._file.text.fileNotFound',
	FILE_TO_BIG: 'global.text.fileTooLarge',
	INTERNAL_ERROR: 'global.text.internalProblem',
};

function writeFileSizePretty(orgFilesize) {
	let filesize = orgFilesize;
	let unit;
	let iterator = 0;

	while (filesize > 1024) {
		filesize = Math.round((filesize / 1024) * 100) / 100;
		iterator += 1;
	}
	switch (iterator) {
		case 0:
			unit = 'B';
			break;
		case 1:
			unit = 'KB';
			break;
		case 2:
			unit = 'MB';
			break;
		case 3:
			unit = 'GB';
			break;
		case 4:
			unit = 'TB';
			break;
		default:
			unit = '';
	}
	return filesize + unit;
}

function showSuccessMessage(message) {
	$.showNotification($t(message), 'success', 5000);
}

function showErrorMessage(message) {
	$.showNotification($t(message), 'danger', 5000);
}

function showAJAXError(err) {
	if (err.responseJSON) {
		const { message } = err.responseJSON;
		showErrorMessage(errorMessages[message] || errorMessages.INTERNAL_ERROR);
	}
}

const reloadPage = (msg, timeout = 2000) => {
	if (msg) {
		showSuccessMessage(
			msg,
		);
	}
	setTimeout(() => {
		window.location.reload();
	}, timeout);
};

function rename(fileName, fileRecordId) {
	$.ajax({
		data: {
			fileName,
		},
		url: `${apiV3FileStorageBasePath}/rename/${fileRecordId}`,
		type: 'PATCH',
		success: () => reloadPage(undefined, 0),
	}).fail(showAJAXError);
}

function remove(fileRecordId) {
	$.ajax({
		url: `${apiV3FileStorageBasePath}/delete/${fileRecordId}`,
		type: 'DELETE',
		success: () => reloadPage(undefined, 0),
	}).fail(showAJAXError);
}

function afterUploadFiles() {
	if (window.localStorage && window.localStorage.getItem('afterUploadFiles')) {
		showSuccessMessage('files._file.text.fileSavedSuccess');
		window.localStorage.removeItem('afterUploadFiles');
	}
}

function submitAfterUpload(type, id) {
	if (type === 'tasks') {
		const nameValue = $('#name').val();
		if (nameValue) {
			window.localStorage.setItem('afterUploadFiles', 'true');
		}

		$('#homework-form').find('input[name="referrer"]')
			.val(window.location.pathname + window.location.search);
		$('#homework-submit-btn').trigger('click');
	}

	if (type === 'submissions') {
		window.localStorage.setItem('afterUploadFiles', 'true');
		$(`form.${id}`).trigger('submit');
	}
}

$(document).ready(() => {
	const $filesStorageComponents = $('.files-storage-component');
	const $modals = $('.modal');
	const $renameModal = $('.files-storage-rename-modal');
	const $deleteModal = $('.files-storage-delete-modal');

	afterUploadFiles();

	function deleteFileClickHandler(e) {
		e.stopPropagation();
		e.preventDefault();
		const $buttonContext = $(e.currentTarget);

		$deleteModal.appendTo('body').modal('show');
		$deleteModal
			.find('.modal-title')
			.text(
				$t('global.text.sureAboutDeleting', { name: $buttonContext.data('fileName') }),
			);

		$deleteModal
			.find('.btn-submit')
			.on('click', () => {
				$deleteModal.modal('hide');
				const fileRecordId = $buttonContext.data('fileId');
				remove(fileRecordId);
			});
	}

	function fileNameEditClickHandler(e) {
		e.stopPropagation();
		e.preventDefault();
		const fileRecordId = $(this).attr('data-file-id');
		const oldName = $(this).attr('data-file-name');
		$renameModal.find('#newNameInput').val(oldName);
		$renameModal.find('#fileRecordId').val(fileRecordId);
		$renameModal.modal('show');
	}

	// eslint-disable-next-line array-callback-return
	$filesStorageComponents.map((_index, element) => {
		const $filesStorageComponent = $(element);
		const $form = $filesStorageComponent.find('.form-files-storage');
		const uploadSection = $filesStorageComponent.find('.section-upload');

		const schoolId = uploadSection.data('school');
		const parentId = uploadSection.data('parentId');
		const parentType = uploadSection.data('parentType');
		const maxFilesize = uploadSection.data('maxFileSize');

		const $progressBar = $filesStorageComponent.find('.progress-bar');
		const $progress = $progressBar.find('.bar');
		const $percentage = $progressBar.find('.percent');

		/** loads dropzone, if it exists on current page * */
		let progressBarActive = false;
		let finishedFilesSize = 0;

		function updateUploadProcessingProgress() {
			if (!progressBarActive) {
				$progress.css('width', '0%');

				$form.fadeOut(50, () => {
					$progressBar.fadeIn(50);
				});

				progressBarActive = true;
			}
		}

		if ($form.dropzone) {
			$form.dropzone({
				url: `${apiV3FileStorageBasePath}/upload/
			${schoolId}/
			${parentType}/
			${parentId}`,
				chunking: true,
				createImageThumbnails: false,
				method: 'POST',
				maxFilesize,
				dictFileTooBig: errorMessages.FILE_TO_BIG,
				init() {
					// this is called on per-file basis
					this.on('processing', updateUploadProcessingProgress);
					this.on('totaluploadprogress', (_, total, uploaded) => {
						const realProgress = (uploaded + finishedFilesSize) / ((total + finishedFilesSize) / 100);

						$progress.stop().animate(
							{ width: `${realProgress}%` },
							{
								step(now) {
									if ($percentage && $percentage.setAttribute) {
										$percentage.html(`${Math.ceil(now)}%`);
										$percentage.setAttribute('aria-valuenow', `${Math.ceil(now)}%`);
									}
								},
							},
						);
					});

					this.on('queuecomplete', () => {
						finishedFilesSize = 0;
						if (progressBarActive) {
							$progressBar.fadeOut(50, () => {
								$form.fadeIn(50);
								submitAfterUpload(parentType, parentId);
							});
							progressBarActive = false;
						}
					});
					this.on('dragover', () => $form.addClass('focus'));
					this.on('dragleave', () => $form.removeClass('focus'));
					this.on('dragend', () => $form.removeClass('focus'));
					this.on('drop', () => $form.removeClass('focus'));
					this.on('error', (file, message) => showErrorMessage(message));
				},
			});
		}

		$($filesStorageComponent).find('button[data-method="delete"]').on('click', deleteFileClickHandler);
		$($filesStorageComponent).find('a[data-method="delete"]').on('click', deleteFileClickHandler);
		$($filesStorageComponent).find('a[data-method="delete"]').on('keypress', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				deleteFileClickHandler(e);
			}
		});

		$($filesStorageComponent).find('.file-name-edit').on('click', fileNameEditClickHandler);
	});

	$('button[data-method="download"]').on('click', (e) => {
		const fileRecordId = $(e.currentTarget).attr('data-file-id');
		const fileName = $(e.currentTarget).attr('data-file-name');
		const url = getFileDownloadUrl(fileRecordId, fileName);
		const a = document.createElement('a');
		a.href = url;
		a.download = url.split('/').pop();
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		e.stopPropagation();
	});

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});

	$('.btn-file-danger').on('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		const $dangerModal = $('.files-storage-danger-modal');
		$dangerModal.appendTo('body').modal('show');
	});

	$($renameModal.find('.btn-submit')).on('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		const fileRecordId = $renameModal.find('#fileRecordId').val();
		const fileName = $renameModal.find('#newNameInput').val();

		if (!fileName) {
			showErrorMessage(errorMessages.FILE_NAME_EMPTY);
			return;
		}
		rename(fileName, fileRecordId);
		$renameModal.modal('hide');
	});

	$deleteModal.find('.close, .btn-close').on('click', () => {
		$deleteModal.modal('hide');
	});

	function fileMouseOverHandler() {
		const size = $(this).attr('data-file-size');
		const id = $(this).attr('data-file-id');

		$(`#${id}`).html(writeFileSizePretty(size));
	}
	$('.file').on('mouseover', fileMouseOverHandler);

	function fileMouseOutHandler() {
		const id = $(this).attr('data-file-id');

		$(`#${id}`).html('');
	}
	$('.file').on('mouseout', fileMouseOutHandler);
});

window.videoClick = function videoClick(e) {
	e.stopPropagation();
	e.preventDefault();
};

$('.videoclick').on('click', (e) => {
	window.videoClick(e);
});

$('.videostop').on('click', () => {
	window.videojs('my-video').pause();
	$('#link').html('');
	$('#picture').attr('src', '');
	$('#file-view').css('display', 'none');
});

$('.videostop').on('keypress', (e) => {
	if (e.key === 'Enter' || e.key === ' ') {
		document.activeElement.click();
	}
});

window.fileViewer = function fileViewer(type, name, id) {
	$('#my-video').css('display', 'none');
	let win;
	const src = getFileDownloadUrl(id, name);
	switch (type) {
		case `image/${type.substr(6)}`:
			window.location.href = '#file-view';
			$('#file-view').css('display', '');
			$('#picture').attr('src', src);
			$('#picture').attr('alt', $t('files.img_alt.altInfoTheImage', { imgName: name }));
			$('.videostop').trigger('focus');
			break;
		case `audio/${type.substr(6)}`:
		case `video/${type.substr(6)}`:
			window.location.href = '#file-view';
			$('#file-view').css('display', '');
			window.videojs('my-video').src({ type, src });
			$('#my-video').css('display', '');
			$('.videostop').trigger('focus');
			break;
		default:
			$('#file-view').hide();
			win = window.open(src, '_blank');
			win.focus();
	}
};

$('.fileviewer').on('click', function determineViewer() {
	const fileviewertype = this.getAttribute('data-file-viewer-type');
	const fileviewersavename = this.getAttribute('data-file-viewer-savename');
	const fileviewerid = this.getAttribute('data-file-viewer-id');
	if (
		fileviewertype
		&& fileviewersavename
		&& fileviewerid
	) {
		window.fileViewer(fileviewertype, fileviewersavename, fileviewerid);
	}
});
