import { getQueryParameterByName } from './helpers/queryStringParameter';

window.addEventListener('DOMContentLoaded', () => {
	let sortBy = getQueryParameterByName('sortBy');
	let sortOrder = getQueryParameterByName('sortOrder');
	const navigate = () => {
		let params = '';
		if (sortBy) {
			params += `sortBy=${sortBy}&`;
		}
		if (sortOrder) {
			params += `sortOrder=${sortOrder}&`;
		}
		window.location = `?${params}`;
	};
	$('select[name="sortBy"]').chosen({
		width: '',
		disable_search: true,
	}).change((_, { selected }) => {
		sortBy = selected;
		navigate();
	});
	$('select[name="sortOrder"]').chosen({
		width: '',
		disable_search: true,
	}).change((_, { selected }) => {
		sortOrder = selected;
		navigate();
	});
});

const getDataValue = (attr) => () => {
	const value = $('.section-upload').data(attr);
	return value || undefined;
};

window.openFolder = (id) => {
	const { pathname } = window.location;
	const reg = new RegExp('/files/(?:my|teams|courses)/(?:.+?)/(.+)');
	let target;

	if (reg.test(pathname)) {
		target = pathname.replace(reg, (m, g) => m.replace(g, id));
	} else {
		target = pathname + (pathname.split('').pop() !== '/' ? '/' : '') + id;
	}

	return target + window.location.search || '';
};

$('.openfolder').on('click', function determineFolder() {
	const folderid = this.getAttribute('data-folder-id');
	if (folderid) {
		window.location.href = window.openFolder(folderid);
	}
});

const getOwnerId = getDataValue('owner');
const getCurrentParent = getDataValue('parent');

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

$(document).ready(() => {
	const $form = $('.form-upload');
	const $progressBar = $('.progress-bar');
	const $progress = $progressBar.find('.bar');
	const $percentage = $progressBar.find('.percent');

	const $modals = $('.modal');
	const $editModal = $('.edit-modal');
	const $deleteModal = $('.delete-modal');
	const $moveModal = $('.move-modal');
	const $disabledMoveModal = $('.move-modal-disabled');
	const $renameModal = $('.rename-modal');
	const $newFileModal = $('.new-file-modal');

	const isCKEditor = window.location.href.indexOf('CKEditor=') !== -1;

	// TODO: replace with something cooler
	const reloadFiles = () => {
		window.location.reload();
	};

	function showAJAXSuccess(message) {
		$.showNotification(message, 'success', 30000);
	}

	function showAJAXError(req, textStatus, errorThrown) {
		$deleteModal.modal('hide');
		$moveModal.modal('hide');
		if (textStatus === 'timeout') {
			$.showNotification($t('global.text.requestTimeout'), 'warn');
		} else {
			$.showNotification(errorThrown, 'danger');
		}
	}

	/** loads dropzone, if it exists on current page * */
	let progressBarActive = false;
	let finishedFilesSize = 0;

	function updateUploadProcessingProgress(file) {
		if (!progressBarActive) {
			$progress.css('width', '0%');

			$form.fadeOut(50, () => {
				$progressBar.fadeIn(50);
			});

			progressBarActive = true;
		}

		this.options.url = file.signedUrl.url;
		this.options.headers = file.signedUrl.header;
	}

	function updateUploadProgressSuccess(file) {
		finishedFilesSize += file.size;
		const parentId = file.parent || getCurrentParent();
		const params = {
			name: file.name,
			owner: getOwnerId(),
			type: file.type,
			size: file.size,
			storageFileName: file.signedUrl.header['x-amz-meta-flat-name'],
			thumbnail: file.signedUrl.header['x-amz-meta-thumbnail'],
		};

		if (parentId) {
			params.parent = parentId;
		}

		// post file meta to proxy file service for persisting data
		$.post('/files/fileModel', params);

		this.removeFile(file);
	}

	if ($form.dropzone) {
		$form.dropzone({
			accept(file, done) {
				if (file.fullPath) {
					const promisePost = (name, parent) => new Promise(((resolve, reject) => {
						$.post('/files/directory', {
							name,
							owner: getOwnerId(),
							parent,
						})
							.done(resolve)
							.fail(reject);
					}));

					const pathArray = file.fullPath.split('/');
					pathArray.pop();

					const lastPromise = pathArray.reduce((seq, name) => seq
						.then((parent) => promisePost(name, parent._id))
						.catch(() => undefined), Promise.resolve({ _id: getCurrentParent() }));

					lastPromise.then((result) => {
						$.post(
							'/files/file',
							{
								parent: result._id,
								type: file.type,
								filename: file.name,
							},
							(data) => {
								file.signedUrl = data.signedUrl;
								file.parent = result._id;
								done();
							},
						).fail(showAJAXError);
					});

					return;
				}

				$.post(
					'/files/file',
					{
						parent: getCurrentParent(),
						type: file.type,
						filename: file.name,
					},
					(data) => {
						file.signedUrl = data.signedUrl;
						file.parent = getCurrentParent();
						done();
					},
				).fail((err) => {
					this.removeFile(file);
					showAJAXError(
						err.responseJSON.error.code,
						err.responseJSON.error.message,
						`${err.responseJSON.error.name} - ${
							err.responseJSON.error.message
						}`,
					);
				});
			},
			createImageThumbnails: false,
			maxFilesize: 1024,
			method: 'put',
			init() {
				// this is called on per-file basis
				this.on('processing', updateUploadProcessingProgress);

				this.on('sending', (file, xhr) => {
					const { send } = xhr;
					xhr.send = () => {
						send.call(xhr, file);
					};
				});

				this.on('totaluploadprogress', (_, total, uploaded) => {
					const realProgress = (uploaded + finishedFilesSize) / ((total + finishedFilesSize) / 100);

					$progress.stop().animate(
						{ width: `${realProgress}%` },
						{
							step(now) {
								$percentage.html(`${Math.ceil(now)}%`);
								if ($percentage) {
									$percentage.setAttribute('aria-valuenow', `${Math.ceil(now)}%`);
								}
							},
						},
					);
				});

				this.on('queuecomplete', () => {
					progressBarActive = false;
					finishedFilesSize = 0;

					$progressBar.fadeOut(50, () => {
						$form.fadeIn(50);
						showAJAXSuccess(
							// eslint-disable-next-line max-len
							$t('files._file.text.fileAddedSuccess'),
						);
						setTimeout(() => {
							reloadFiles(); // waiting for success message
						}, 2000);
					});
				});

				this.on('success', updateUploadProgressSuccess);
				this.on('dragover', () => $form.addClass('focus'));
				this.on('dragleave', () => $form.removeClass('focus'));
				this.on('dragend', () => $form.removeClass('focus'));
				this.on('drop', () => $form.removeClass('focus'));
			},
		});
	}

	$('a[data-method="download"]').on('click', (e) => {
		e.stopPropagation();
	});

	function deleteFileClickHandler(e) {
		e.stopPropagation();
		e.preventDefault();
		const $buttonContext = $(this);

		$deleteModal.appendTo('body').modal('show');
		$deleteModal
			.find('.modal-title')
			.text(
				$t('global.text.sureAboutDeleting', { name: $buttonContext.data('file-name') }),
			);

		$deleteModal
			.find('.btn-submit')
			.unbind('click')
			.on('click', () => {
				$.ajax({
					url: $buttonContext.attr('href'),
					type: 'DELETE',
					data: {
						id: $buttonContext.data('file-id'),
					},
					success: reloadFiles,
					error: showAJAXError,
				});
			});
	}

	$('a[data-method="delete"]').on('click', deleteFileClickHandler);

	$deleteModal.find('.close, .btn-close').on('click', () => {
		$deleteModal.modal('hide');
	});

	$('.create-directory').on('click', () => {
		$editModal.appendTo('body').modal('show');
		$renameModal.modal('hide');
	});

	$('.new-file').on('click', () => {
		if (!window.location.href.includes('/courses/')) { $('#student-can-edit-div').hide(); }
		$newFileModal.appendTo('body').modal('show');
	});

	const returnFileUrl = (fileId, fileName) => {
		if (window.opener) {
			const fullUrl = `/files/file?file=${fileId}&name=${fileName}`;
			window.opener.postMessage(fullUrl, '*');
		}
		window.close();
	};

	function cardFileClickHandler() {
		if (isCKEditor) { returnFileUrl($(this).data('file-id'), $(this).data('file-name')); }
	}
	$('.card.file').on('click', cardFileClickHandler);

	function cardFileTitleClickHandler(e) {
		if (isCKEditor) {
			e.preventDefault();
			const $card = $(this).closest('.card.file');
			returnFileUrl($card.data('file-id'), $card.data('file-name'));
		}
	}
	$('.card.file .title').on('click', cardFileTitleClickHandler);

	function fileSearchClickHandler() {
		const $inputField = $(this);
		const $parent = $inputField.parent().parent();

		// add filter fields below file-search-bar
		const filterOptions = [
			{ key: 'pics', label: $t('files.search.label.pics') },
			{ key: 'videos', label: $t('files.search.label.videos') },
			{ key: 'pdfs', label: $t('files.search.label.pdfs') },
			{ key: 'msoffice', label: $t('files.search.label.msoffice') },
		];

		const $filterOptionsDiv = $('<div class="filter-options"></div>');

		filterOptions.forEach((fo) => {
			const $newFilterOption = $(
				`<div data-key="${
					fo.key
				}" class="filter-option" onClick="window.location.href = '/files/search?filter=${
					fo.key
				}'"></div>`,
			);
			const $newFilterLabel = $(`<span>Nach <b>${fo.label}</b> filtern</span>`);
			$newFilterOption.append($newFilterLabel);

			$filterOptionsDiv.append($newFilterOption);
		});

		$filterOptionsDiv.width($('.search-wrapper').width());
		$parent.append($filterOptionsDiv);
	}
	$('.file-search').click(fileSearchClickHandler);

	$('.file-search').blur(() => {
		setTimeout(() => {
			// wait for other events
			$('.filter-options').remove();
		}, 100);
	});

	$editModal.find('.modal-form').on('submit', (e) => {
		e.preventDefault();
		$.post(
			'/files/directory',
			{
				name: $editModal.find('[name="new-dir-name"]').val(),
				owner: getOwnerId(),
				parent: getCurrentParent(),
			},
			() => {
				reloadFiles();
			},
		).fail(showAJAXError);
	});

	$newFileModal.find('.modal-form').on('submit', (e) => {
		e.preventDefault();

		let studentEdit = false;
		if (document.getElementById('student-can-edit')) {
			studentEdit = document.getElementById('student-can-edit').checked;
		}
		const fileType = $('#file-ending').val();
		if (!fileType || fileType === 'Format auswählen' || fileType === $t('files.button.selectFormat')) {
			$.showNotification($t('files._file.text.pleaseSelectFileType'), 'danger', 30000);
		} else {
			$.post(
				'/files/newFile',
				{
					name: $newFileModal.find('[name="new-file-name"]').val(),
					type: fileType,
					owner: getOwnerId(),
					parent: getCurrentParent(),
					studentEdit,
				},
				(id) => {
					window.location.href = `/files/file/${id}/lool`;
				},
			).fail(showAJAXError);
		}
	});

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});

	function fileMouseOverHandler() {
		const size = $(this).attr('data-file-size');
		const id = $(this).attr('data-file-id');

		$(`#${id}`).html(writeFileSizePretty(size));
	}
	$('.file').mouseover(fileMouseOverHandler);

	function fileMouseOutHandler() {
		const id = $(this).attr('data-file-id');

		$(`#${id}`).html('');
	}
	$('.file').mouseout(fileMouseOutHandler);

	function populateRenameModal(oldName, action, title) {
		const form = $renameModal.find('.modal-form');
		form.attr('action', action);

		populateModalForm($renameModal, {
			title,
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.save'),
			fields: {
				name: oldName,
			},
		});

		$renameModal.modal('show');
	}

	function fileNameEditClickHandler(e) {
		e.stopPropagation();
		e.preventDefault();
		const fileId = $(this).attr('data-file-id');
		const oldName = $(this).attr('data-file-name');

		populateRenameModal(
			oldName,
			`/files/fileModel/${fileId}/rename`,
			$t('files.label.renameFile'),
		);
	}
	$('.file-name-edit').click(fileNameEditClickHandler);

	function dirRenameClickHandler(e) {
		e.stopPropagation();
		e.preventDefault();
		const dirId = $(this).attr('data-directory-id');
		const oldName = $(this).attr('data-directory-name');

		populateRenameModal(
			oldName,
			`/files/directoryModel/${dirId}/rename`,
			$t('files._file.headline.renameDir'),
		);
	}
	$('a[data-method="dir-rename"]').on('click', dirRenameClickHandler);

	const fileShare = (fileId, $shareModal, view) => {
		const $input = $shareModal.find('input[name="invitation"]');

		$input.click(() => {
			$(this).select();
		});
		$input.hide();

		$shareModal.appendTo('body').modal('show');

		$.ajax({ url: `/files/share/?file=${fileId}` })
			.then((result) => {
				const target = view
					? `files/file/${fileId}/lool?share=${result.shareToken}`
					: `files/fileModel/${fileId}/proxy?share=${result.shareToken}`;
				return $.ajax({
					type: 'POST',
					url: '/link/',
					beforeSend(xhr) {
						xhr.setRequestHeader('Csrf-Token', csrftoken);
					},
					data: { target },
				});
			})
			.then((link) => {
				populateModalForm($shareModal, {
					title: $t('files._file.headline.shareLink'),
					closeLabel: $t('global.button.close'),
					fields: {
						invitation: link.newUrl,
					},
				});

				$input.val(link.newUrl);
				$input.show();
			})
			.catch((err) => {
				// eslint-disable-next-line no-console
				console.error(err);
			});
	};

	$('.btn-file-share').click(function ev(e) {
		e.stopPropagation();
		e.preventDefault();
		const fileId = $(this).attr('data-file-id');
		const $shareModal = $('.share-modal');
		fileShare(fileId, $shareModal);
	});

	$('.btn-file-danger').click((e) => {
		e.stopPropagation();
		e.preventDefault();
		const $dangerModal = $('.danger-modal');
		$dangerModal.appendTo('body').modal('show');
	});

	function filePermissions(fileId, $permissionModal) {
		const $loader = $permissionModal.find('.loader');
		const $table = $('.permissions-modal table');
		const $message = $('.permissions-modal p.message');

		$table.find('tbody').empty();
		$table.hide();
		$message.hide();
		$permissionModal.appendTo('body').modal('show');

		$.ajax({ url: `/files/permissions/?file=${fileId}` })
			.then((permissions) => {
				const nameMap = {
					teacher: $t('global.role.text.teacher'),
					student: $t('global.link.administrationStudents'),
					teammember: $t('global.role.text.member'),
					teamexpert: $t('global.role.text.expert'),
					teamleader: $t('global.role.text.leader'),
					teamadministrator: $t('global.role.text.administrator'),
					teamowner: $t('global.role.text.owner'),
				};

				populateModalForm($permissionModal, {
					title: $t('files._file.headline.editPermissions'),
					closeLabel: $t('global.button.cancel'),
					submitLabel: $t('global.button.save'),
					fields: {
						fileId,
					},
				});

				$loader.hide();

				if (permissions && permissions.length) {
					$table.find('tbody').html(
						permissions
							.reverse()
							.map(({
								name, write, read, refId,
							}) => `<tr>
									<td>${nameMap[name] || name}</td>
									<td>
										<input
											type="checkbox"
											name="read-${refId}"
											${typeof read === 'boolean' && read ? 'checked' : ''}
											${typeof read === 'undefined' ? 'disabled checked' : ''}
										/>
									</td>
									<td>
										<input
											type="checkbox"
											name="write-${refId}"
											${typeof write === 'boolean' && write ? 'checked' : ''}
											${typeof write === 'undefined' ? 'disabled checked' : ''}
										/>
									</td>
								</tr>`),
					);

					$table.on('click', 'input[type="checkbox"]', (e) => {
						const $input = $(e.target);
						// eslint-disable-next-line max-len
						const $colInputs = $table.find(`td:nth-child(${$input.parent().index() + 1}) input[type="checkbox"]`);
						const $inputIndex = $colInputs.index($input);

						if (!$input.prop('checked')) {
							// eslint-disable-next-line func-names
							$colInputs.each(function (idx) {
								$(this).prop('checked', idx < $inputIndex);
							});
						}
					});

					$table.show();
				} else {
					$message.text($t('files._file.text.thereAreNoPermissionsToEdit'));
					$message.show();
				}
			})
			.catch((err) => {
				populateModalForm($permissionModal, {
					title: $t('files._file.headline.editPermissions'),
					closeLabel: $t('global.button.cancel'),
				});

				$loader.hide();

				// eslint-disable-next-line no-console
				console.error(err);
				$message.text($t('files._file.text.errorWhileLoadingPermissions'));
				$message.show();
			});
	}

	function fileSettingsClickHandler(e) {
		e.stopPropagation();
		e.preventDefault();
		const fileId = $(this).attr('data-file-id');
		const $permissionModal = $('.permissions-modal');
		filePermissions(fileId, $permissionModal);
	}
	$('.btn-file-settings').click(fileSettingsClickHandler);

	$('.permissions-modal .modal-form').on('submit', (e) => {
		e.preventDefault();

		const inputs = $(e.target).find('input[type="checkbox"]').toArray()
			.filter(({ defaultChecked, checked }) => defaultChecked !== checked);
		const fileId = $(e.target).find('input[name="fileId"]').val();
		const permissions = inputs.reduce((arr, input) => {
			const [action, refId] = input.name.split('-');
			const perm = arr.find((i) => i.refId === refId);

			if (perm) {
				perm[action] = input.checked;
				return arr;
			}

			arr.push({
				refId,
				[action]: input.checked,
			});

			return arr;
		}, []);

		if (!inputs.length) {
			return;
		}

		$.ajax({
			url: '/files/permissions',
			method: 'PATCH',
			data: { fileId, permissions },
		})
			.done(() => {
				$.showNotification($t('files._file.text.permissionsChangedSuccess'), 'success', true);
				$('.permissions-modal').modal('hide');
			})
			.fail(() => {
				$.showNotification($t('global.text.errorChangingFilePermissions'), 'danger', true);
			});
	});

	const moveToDirectory = (modal, targetId) => {
		const fileId = modal
			.find('.modal-form')
			.find("input[name='fileId']")
			.val();

		$.ajax({
			url: `/files/file/${fileId}/move/`,
			type: 'POST',
			data: {
				parent: targetId,
			},
			success: reloadFiles,
			error: showAJAXError,
		});
	};

	const openSubTree = (e) => {
		const $parent = $(e.target).parent();
		const $parentDirElement = $parent.parent();
		const $toggle = $parent.find('.toggle-icon');
		const $subMenu = $parentDirElement.children('.dir-sub-menu');
		const isCollapsed = $toggle.hasClass('fa-plus-square-o');

		if (isCollapsed) {
			$subMenu.css('display', 'block');
			$toggle.removeClass('fa-plus-square-o');
			$toggle.addClass('fa-minus-square-o');
		} else {
			$subMenu.css('display', 'none');
			$toggle.removeClass('fa-minus-square-o');
			$toggle.addClass('fa-plus-square-o');
		}
	};

	function addDirTree($parent, dirTree, isMainFolder = true) {
		dirTree.forEach((d) => {
			const $dirElement = $(
				`<div class="dir-element dir-${
					isMainFolder ? 'main' : 'sub'
				}-element" id="${d._id}" data-href="${d._id}"></div>`,
			);

			const $dirHeader = $(
				`<div class="dir-header dir-${
					isMainFolder ? 'main' : 'sub'
				}-header"></div>`,
			);
			const $toggle = $(
				'<i class="fa fa-plus-square-o toggle-icon"></i>',
			).click(openSubTree);
			const $dirSpan = $(`<span>${d.name}</span>`).click(openSubTree);
			// just displayed on hovering parent element
			const $move = $(`<i class="fa ${d._id ? 'fa-share' : ''}"></i>`).click(
				d._id ? moveToDirectory.bind(this, $moveModal, d._id) : '',
			);

			$dirHeader.append($toggle);
			$dirHeader.append($dirSpan);
			$dirHeader.hover(
				() => {
					$move.css('display', 'inline');
				},
				() => {
					$move.css('display', 'none');
				},
			);
			$dirHeader.append($move);

			$dirElement.append($dirHeader);

			if (d.children && d.children.length) {
				const $newList = $('<div class="dir-sub-menu"></div>');
				addDirTree($newList, d.children, false);
				$dirElement.append($newList);
			} else {
				$toggle.css('visibility', 'hidden');
			}
			$parent.append($dirElement);
		});
	}

	$('.btn-file-move').on('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		const $context = $(e.currentTarget);

		// temporary disabled
		if ($context.attr('disabled')) {
			$disabledMoveModal.appendTo('body').modal('show');
			return;
		}
		populateModalForm($moveModal, {
			title: $t('files._file.headline.moveFile'),
			fields: {
				fileId: $context.attr('data-file-id'),
				fileName: $context.attr('data-file-name'),
				filePath: $context.attr('data-file-path'),
			},
		});

		$moveModal.find('.modal-footer').empty();
		$moveModal.appendTo('body').modal('show');

		const $loader = $moveModal.find('.loader');
		let $dirTreeList = $moveModal.find('.dir-main-menu');
		const $dirTree = $moveModal.find('.directories-tree');

		if (!$dirTreeList.length) {
			$loader.show();
			// fetch all directories the user is permitted to access
			$.getJSON('/files/permittedDirectories/', (result) => {
				// add folder structure recursively
				$dirTreeList = $('<div class="dir-main-menu"></div>');
				addDirTree($dirTreeList, result);
				$loader.hide();
				$dirTree.append($dirTreeList);
				// remove modal-footer
			});
		}
	});
});

window.videoClick = function videoClick(e) {
	e.stopPropagation();
	e.preventDefault();
};

$('.videoclick').on('click', (e) => {
	window.videoClick(e);
});

$('.videostop').on('click', () => {
	window.videojs('my-video').ready(() => {
		this.pause();
	});
	$('#link').html('');
	$('#picture').attr('src', '');
	$('#file-view').css('display', 'none');
});

const fileTypes = {
	docx:
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	pptx:
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	ppt: 'application/vnd.ms-powerpoint',
	xls: 'application/vnd.ms-excel',
	doc: 'application/vnd.ms-word',
	odt: 'application/vnd.oasis.opendocument.text',
	txt: 'text/plain',
	pdf: 'application/pdf',
};

window.fileViewer = function fileViewer(type, name, id) {
	$('#my-video').css('display', 'none');
	let win;

	// detect filetype according to line ending
	if (type.length === 0) {
		const fType = name.split('.');
		// eslint-disable-next-line no-param-reassign
		type = fileTypes[fType[fType.length - 1]] || '';
	}

	switch (type) {
		case `image/${type.substr(6)}`:
			window.location.href = '#file-view';
			$('#file-view').css('display', '');
			$('#picture').attr('src', `/files/file?file=${id}&name=${name}`);
			break;

		case `audio/${type.substr(6)}`:
		case `video/${type.substr(6)}`:
			window.location.href = '#file-view';
			$('#file-view').css('display', '');
			// eslint-disable-next-line no-undef
			videojs('my-video').ready(function () {
				this.src({ type, src: `/files/file?file=${id}` });
			});
			$('#my-video').css('display', '');
			break;

		case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // .docx
		case 'application/vnd.ms-word':
		case 'application/msword': // .doc
		case 'application/vnd.oasis.opendocument.text': // .odt
		case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': // .xlsx
		case 'application/vnd.ms-excel':
		case 'application/msexcel': // .xls
		case 'application/vnd.oasis.opendocument.spreadsheet': // .ods
		case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': // .pptx
		case 'application/vnd.ms-powerpoint':
		case 'application/mspowerpoint': // .ppt
		case 'application/vnd.oasis.opendocument.presentation': // .odp
		case 'text/plain': // .txt
			$('#file-view').hide();
			win = window.open(`/files/file/${id}/lool`, '_self');
			win.focus();
			break;
		case 'application/pdf': // .pdf
			$('#file-view').hide();
			win = window.open(`/files/file?file=${id}`, '_blank');
			if (!win) {
				// eslint-disable-next-line no-console
				console.error(`window.open("/files/file?file=${id}", '_blank') failed`);
				$.showNotification(
					$t('files._file.text.errorWhileOpeningFile'),
					'danger',
				);
			}
			win.focus();
			break;
		default:
			$('#file-view').hide();
			win = window.open(`/files/file?file=${id}&download`, '_blank');
			if (!win) {
				// eslint-disable-next-line no-console
				console.error(`window.open("/files/file?file=${id}", '_blank') failed`);
				$.showNotification(
					$t('files._file.text.errorWhileOpeningFile'),
					'danger',
				);
			}
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
