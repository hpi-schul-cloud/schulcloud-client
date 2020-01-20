/* eslint-env jquery */

import { getQueryParameterByName } from './helpers/queryStringParameter';

const getDataValue = function (attr) {
	return function () {
		const value = $('.section-upload').data(attr);
		return value || undefined;
	};
};

window.openFolder = function (id) {
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

const getOwnerId = getDataValue('owner');
const getCurrentParent = getDataValue('parent');

$(document).ready(() => {
	const $form = $('.form-upload');
	const $progressBar = $('.progress-bar');
	const $progress = $progressBar.find('.bar');
	const $percentage = $progressBar.find('.percent');

	const $modals = $('.modal');
	const $editModal = $('.edit-modal');
	const $deleteModal = $('.delete-modal');
	const $moveModal = $('.move-modal');
	const $renameModal = $('.rename-modal');
	const $newFileModal = $('.new-file-modal');

	const isCKEditor = window.location.href.indexOf('CKEditor=') !== -1;

	const currentFile = {};

	// TODO: replace with something cooler
	const reloadFiles = function () {
		window.location.reload();
	};

	function showAJAXSuccess(message) {
		$.showNotification(message, 'success', 30000);
	}

	function showAJAXError(req, textStatus, errorThrown) {
		$deleteModal.modal('hide');
		$moveModal.modal('hide');
		if (textStatus === 'timeout') {
			$.showNotification('Zeitüberschreitung der Anfrage', 'warn');
		} else {
			$.showNotification(errorThrown, 'danger');
		}
	}

	/**
   * gets the directory name of a file's fullPath (all except last path-part)
   * @param {string} fullPath - the fullPath of a file
   * * */
	function getDirname(fullPath) {
		return fullPath
			.split('/')
			.slice(0, -1)
			.join('/');
	}

	/** temp save for createdDirs, reset after reload * */
	const createdDirs = [];

	/** loads dropzone, if it exists on current page * */
	let progressBarActive = false;
	let finishedFilesSize = 0;
	if ($form.dropzone) {
		$form.dropzone({
			accept(file, done) {
				if (file.fullPath) {
					const promisePost = function (name, parent) {
						return new Promise(((resolve, reject) => {
							$.post('/files/directory', {
								name,
								owner: getOwnerId(),
								parent,
							})
								.done(resolve)
								.fail(reject);
						}));
					};

					const pathArray = file.fullPath.split('/');
					pathArray.pop();

					const lastPromise = pathArray.reduce((seq, name) => seq
						.then(parent => promisePost(name, parent._id))
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
				this.on('processing', function (file) {
					if (!progressBarActive) {
						$progress.css('width', '0%');

						$form.fadeOut(50, () => {
							$progressBar.fadeIn(50);
						});

						progressBarActive = true;
					}

					this.options.url = file.signedUrl.url;
					this.options.headers = file.signedUrl.header;
				});

				this.on('sending', (file, xhr, formData) => {
					const _send = xhr.send;
					xhr.send = function () {
						_send.call(xhr, file);
					};
				});

				this.on('totaluploadprogress', (progress, total, uploaded) => {
					const realProgress = (uploaded + finishedFilesSize) / ((total + finishedFilesSize) / 100);

					$progress.stop().animate(
						{ width: `${realProgress}%` },
						{
							step(now) {
								$percentage.html(`${Math.ceil(now)}%`);
							},
						},
					);
				});

				this.on('queuecomplete', (file, response) => {
					progressBarActive = false;
					finishedFilesSize = 0;

					$progressBar.fadeOut(50, () => {
						$form.fadeIn(50);
						showAJAXSuccess(
							'Datei(en) erfolgreich hinzugefügt und werden gleich nach einer Aktualisierung der Seite angezeigt.',
						);
						setTimeout(() => {
							reloadFiles(); // waiting for success message
						}, 2000);
					});
				});

				this.on('success', function (file, response) {
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
				});

				this.on('dragover', (file, response) => {
					$form.addClass('focus');
				});

				this.on('dragleave', () => {
					$form.removeClass('focus');
				});

				this.on('dragend', (file, response) => {
					$form.removeClass('focus');
				});

				this.on('drop', (file, response) => {
					$form.removeClass('focus');
				});
			},
		});
	}

	$('a[data-method="download"]').on('click', (e) => {
		e.stopPropagation();
	});

	$('a[data-method="delete"]').on('click', function (e) {
		e.stopPropagation();
		e.preventDefault();
		const $buttonContext = $(this);

		$deleteModal.appendTo('body').modal('show');
		$deleteModal
			.find('.modal-title')
			.text(
				`Bist du dir sicher, dass du '${
					$buttonContext.data('file-name')
				}' löschen möchtest?`,
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
	});

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

	$('.card.file').on('click', function () {
		if (isCKEditor) { returnFileUrl($(this).data('file-id'), $(this).data('file-name')); }
	});

	$('.card.file .title').on('click', function (e) {
		if (isCKEditor) {
			e.preventDefault();
			const $card = $(this).closest('.card.file');
			returnFileUrl($card.data('file-id'), $card.data('file-name'));
		}
	});

	$('.file-search').click(function () {
		const $input_field = $(this);
		const $parent = $input_field.parent().parent();

		// add filter fields below file-search-bar
		const filterOptions = [
			{ key: 'pics', label: 'Bilder' },
			{ key: 'videos', label: 'Videos' },
			{ key: 'pdfs', label: 'PDF Dokumente' },
			{ key: 'msoffice', label: 'Word/Excel/PowerPoint' },
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
	});

	$('.file-search').blur((e) => {
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
			(data) => {
				reloadFiles();
			},
		).fail(showAJAXError);
	});

	$newFileModal.find('.modal-form').on('submit', (e) => {
		e.preventDefault();

		let studentEdit = false;
		if (document.getElementById('student-can-edit')) { studentEdit = document.getElementById('student-can-edit').checked; }
		const fileType = $('#file-ending').val();
		if (!fileType || fileType === 'Format auswählen') {
			$.showNotification('Bitte wähle einen Dateityp aus.', 'danger', 30000);
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

	let returnFileUrl = (fileId, fileName) => {
		const fullUrl = `/files/file?file=${fileId}&name=${fileName}`;
		const funcNum = getQueryParameterByName('CKEditorFuncNum');
		window.opener.CKEDITOR.tools.callFunction(funcNum, fullUrl);
		window.close();
	};

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});

	$('.file').mouseover(function (e) {
		const size = $(this).attr('data-file-size');
		const id = $(this).attr('data-file-id');

		$(`#${id}`).html(writeFileSizePretty(size));
	});

	$('.file').mouseout(function (e) {
		const id = $(this).attr('data-file-id');

		$(`#${id}`).html('');
	});

	const populateRenameModal = function (oldName, action, title) {
		const form = $renameModal.find('.modal-form');
		form.attr('action', action);

		populateModalForm($renameModal, {
			title,
			closeLabel: 'Abbrechen',
			submitLabel: 'Speichern',
			fields: {
				name: oldName,
			},
		});

		$renameModal.modal('show');
	};

	$('.file-name-edit').click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		const fileId = $(this).attr('data-file-id');
		const oldName = $(this).attr('data-file-name');

		populateRenameModal(
			oldName,
			`/files/fileModel/${fileId}/rename`,
			'Datei umbenennen',
		);
	});

	$('a[data-method="dir-rename"]').on('click', function (e) {
		e.stopPropagation();
		e.preventDefault();
		const dirId = $(this).attr('data-directory-id');
		const oldName = $(this).attr('data-directory-name');

		populateRenameModal(
			oldName,
			`/files/directoryModel/${dirId}/rename`,
			'Ordner umbenennen',
		);
	});

	$('.btn-file-share').click(function ev(e) {
		e.stopPropagation();
		e.preventDefault();
		const fileId = $(this).attr('data-file-id');
		const $shareModal = $('.share-modal');
		fileShare(fileId, $shareModal);
	});

	$('.btn-file-danger').click(function ev(e) {
		e.stopPropagation();
		e.preventDefault();
		const $dangerModal = $('.danger-modal');
		$dangerModal.appendTo('body').modal('show');
	});

	$('.btn-file-settings').click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		const fileId = $(this).attr('data-file-id');
		const $permissionModal = $('.permissions-modal');
		filePermissions(fileId, $permissionModal);
	});

	const filePermissions = function (fileId, $permissionModal) {
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
					teacher: 'Lehrer',
					student: 'Schüler',
					teammember: 'Mitglied',
					teamexpert: 'Experte',
					teamleader: 'Leiter',
					teamadministrator: 'Administrator',
					teamowner: 'Eigentümer',
				};

				populateModalForm($permissionModal, {
					title: 'Berechtigungen bearbeiten',
					closeLabel: 'Abbrechen',
					submitLabel: 'Speichern',
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
									<td><input type="checkbox" name="read-${refId}" ${typeof read === 'boolean' && read ? 'checked' : ''} ${typeof read === 'undefined' ? 'disabled checked' : ''}/></td>
									<td><input type="checkbox" name="write-${refId}" ${typeof write === 'boolean' && write ? 'checked' : ''} ${typeof write === 'undefined' ? 'disabled checked' : ''}/></td>
								</tr>`),
					);

					$table.on('click', 'input[type="checkbox"]', (e) => {
						const $input = $(e.target);
						const $colInputs = $table.find(`td:nth-child(${$input.parent().index() + 1}) input[type="checkbox"]`);
						const $inputIndex = $colInputs.index($input);

						if (!$input.prop('checked')) {
							$colInputs.each(function (idx) {
								$(this).prop('checked', idx < $inputIndex);
							});
						}
					});

					$table.show();
				} else {
					$message.text('Keine Berechtigungen zum Bearbeiten vorhanden.');
					$message.show();
				}
			})
			.catch((err) => {
				populateModalForm($permissionModal, {
					title: 'Berechtigungen bearbeiten',
					closeLabel: 'Abbrechen',
				});

				$loader.hide();

				console.log('error', err);
				$message.text('Leider ist ein Fehler beim Abfragen der Berechtigungen aufgetreten.');
				$message.show();
			});
	};

	$('.permissions-modal .modal-form').on('submit', (e) => {
		e.preventDefault();

		const inputs = $(e.target).find('input[type="checkbox"]').toArray()
			.filter(({ defaultChecked, checked }) => defaultChecked !== checked);
		const fileId = $(e.target).find('input[name="fileId"]').val();
		const permissions = inputs.reduce((arr, input) => {
			const [action, refId] = input.name.split('-');
			const perm = arr.find(i => i.refId === refId);

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
				$.showNotification('Datei-Berechtigungen erfolgreich geändert', 'success', true);
				$('.permissions-modal').modal('hide');
			})
			.fail(() => {
				$.showNotification('Problem beim Ändern der Berechtigungen', 'danger', true);
			});
	});

	const fileShare = (fileId, $shareModal, view) => {
		const $input = $shareModal.find('input[name="invitation"]');

		$input.click(() => {
			$(this).select();
		});
		$input.hide();

		$shareModal.appendTo('body').modal('show');

		$.ajax({ url: `/files/share/?file=${fileId}` })
			.then((result) => {
				const target = view ? `files/file/${fileId}/lool?share=${result.shareToken}` : `files/fileModel/${fileId}/proxy?share=${result.shareToken}`;
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
					title: 'Freigabe-Link',
					closeLabel: 'Schließen',
					fields: {
						invitation: link.newUrl,
					},
				});

				$input.val(link.newUrl);
				$input.show();
			})
			.catch((err) => {
				console.log('error', err);
			});
	};

	const moveToDirectory = function (modal, targetId) {
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

	const openSubTree = function (e) {
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

	const addDirTree = function ($parent, dirTree, isMainFolder = true) {
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
	};

	$('.btn-file-move').on('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		const $context = $(e.currentTarget);

		// eslint-disable no-undef
		populateModalForm($moveModal, { // eslint-disable-line
			title: 'Datei verschieben',
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
const $openModal = $('.open-modal');

window.videoClick = function videoClick(e) {
	e.stopPropagation();
	e.preventDefault();
};

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

		case 'application/pdf': // .pdf
			$('#file-view').hide();
			win = window.open(`/files/file?file=${id}`, '_blank');
			win.focus();
		break;
		default:
			$('#file-view').hide();
			win = window.open(`/files/file?file=${id}&download`, '_blank');
			win.focus();
	}
};

/**
 * Show Google-Viewer/Office online in iframe, after user query (and set cookie)
 * @deprecated
 * */
function openInIframe(source) {
	$('input.box').each(function () {
		const mycookie = $.cookie($(this).attr('name'));
		if (mycookie && mycookie == 'true') {
			$(this).prop('checked', mycookie);
			$('#link').html(
				`<iframe class="vieweriframe" src=${
					source
				}>`
				+ '<p>Dein Browser unterstützt dies nicht.</p></iframe>',
			);
			$('#link').css('display', '');
		} else {
			$openModal.appendTo('body').modal('show');
			$openModal
				.find('.btn-submit')
				.unbind('click')
				.on('click', () => {
					$.cookie(
						$('input.box').attr('name'),
						$('input.box').prop('checked'),
						{
							path: '/',
							expires: 365,
						},
					);

					$('#link').html(
						`<iframe class="vieweriframe" src=${
							source
						}>`
						+ '<p>Dein Browser unterstützt dies nicht.</p></iframe>',
					);
					$('#link').css('display', '');
					$openModal.modal('hide');
				});

			$openModal
				.find('.close, .btn-close')
				.unbind('click')
				.on('click', () => {
					$openModal.modal('hide');
					window.location.href = '#_';
				});
		}
	});
}

function writeFileSizePretty(filesize) {
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
