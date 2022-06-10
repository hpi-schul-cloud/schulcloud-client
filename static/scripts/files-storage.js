const getDataValue = (attr) => () => {
	const value = $('#files-storage-component').find('.section-upload').data(attr);
	return value || undefined;
};

const getSchoolId = getDataValue('school');
const getCurrentParentId = getDataValue('parent-id');
const getCurrentParentType = getDataValue('parent-type');
const apiBasePath = '/api/v3/file';
const maxFilesize = $('#files-storage-component').data('max-file-size');

const messages = {
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
		showErrorMessage(messages[message] || messages.INTERNAL_ERROR);
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
		url: `${apiBasePath}/rename/${fileRecordId}`,
		type: 'PATCH',
		success: () => reloadPage(undefined, 0),
	}).fail(showAJAXError);
}

function remove(fileRecordId) {
	$.ajax({
		url: `${apiBasePath}/delete/${fileRecordId}`,
		type: 'DELETE',
		success: () => reloadPage(undefined, 0),
	}).fail(showAJAXError);
}

$(document).ready(() => {
	const $form = $('#files-storage-component').find('.form-upload');
	const $progressBar = $('#files-storage-component').find('.progress-bar');
	const $progress = $progressBar.find('.bar');
	const $percentage = $progressBar.find('.percent');

	const $modals = $('#files-storage-component').find('.modal');
	const $renameModal = $('#files-storage-component').find('.rename-modal');
	const $deleteModal = $('#files-storage-component').find('.delete-modal');

	/** loads dropzone, if it exists on current page * */
	let progressBarActive = false;
	let finishedFilesSize = 0;

	function deleteFileClickHandler(e) {
		e.stopPropagation();
		e.preventDefault();
		const $buttonContext = $(e.currentTarget);

		$deleteModal.appendTo('body').modal('show');
		$deleteModal
			.find('.modal-title')
			.text(
				$t('global.text.sureAboutDeleting', { name: $buttonContext.data('file-name') }),
			);

		$deleteModal
			.find('.btn-submit')
			.on('click', () => {
				$deleteModal.modal('hide');
				const fileRecordId = $buttonContext.data('file-id');
				remove(fileRecordId);
			});
	}

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
			url: `${apiBasePath}/upload/
			${getSchoolId()}/
			${getCurrentParentType()}/
			${getCurrentParentId()}`,
			chunking: true,
			createImageThumbnails: false,
			method: 'POST',
			maxFilesize,
			dictFileTooBig: messages.FILE_TO_BIG,
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
							reloadPage('files._file.text.fileAddedSuccess');
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

	$('button[data-method="download"]').on('click', (e) => {
		const fileRecordId = $(e.currentTarget).attr('data-file-id');
		const fileName = $(e.currentTarget).attr('data-file-name');
		const url = `${apiBasePath}/download/${fileRecordId}/${fileName}`;
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
		const $dangerModal = $('.danger-modal');
		$dangerModal.appendTo('body').modal('show');
	});

	$($renameModal.find('.btn-submit')).on('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		const fileRecordId = $renameModal.find('#fileRecordId').val();
		const fileName = $renameModal.find('#newNameInput').val();
		rename(fileName, fileRecordId);
		$renameModal.modal('hide');
	});

	$('#files-storage-component').find('button[data-method="delete"]').on('click', deleteFileClickHandler);
	$('#files-storage-component').find('a[data-method="delete"]').on('click', deleteFileClickHandler);
	$('#files-storage-component').find('a[data-method="delete"]').on('keypress', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			deleteFileClickHandler(e);
		}
	});

	$deleteModal.find('.close, .btn-close').on('click', () => {
		$deleteModal.modal('hide');
	});

	function populateRenameModal(fileRecordId, oldName, action, title) {
		const form = $renameModal.find('.modal-form');
		form.attr('action', action);

		populateModalForm($renameModal, {
			title,
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.save'),
			fields: {
				fileRecordId,
				name: oldName,
			},
		});

		$renameModal.modal('show');
	}
	function fileNameEditClickHandler(e) {
		e.stopPropagation();
		e.preventDefault();
		const fileRecordId = $(this).attr('data-file-id');
		const oldName = $(this).attr('data-file-name');

		populateRenameModal(
			fileRecordId,
			oldName,
			$t('files.label.renameFile'),
		);
	}

	$('#files-storage-component').find('.file-name-edit').on('click', fileNameEditClickHandler);

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
	const src = `${apiBasePath}/download/${id}/${name}`;
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

$('.fileviewer').on('click', function determineViewer(e) {
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
