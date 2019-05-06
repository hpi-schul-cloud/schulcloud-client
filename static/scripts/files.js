/* eslint-env jquery */

const getDataValue = function(attr) {
  return function() {
    const value = $(".section-upload").data(attr);
    return value ? value : undefined;
  };
};

window.openFolder = function(id) {
  let pathname = location.pathname;
  const reg = new RegExp("/files/(?:my|teams|courses)/(?:.+?)/(.+)");
  let target;

  if (reg.test(pathname)) {
    target = pathname.replace(reg, function(m, g) {
      return m.replace(g, id);
    });
  } else {
    target = pathname + (pathname.split("").pop() !== "/" ? "/" : "") + id;
  }

  return target + location.search || "";
};

const getOwnerId = getDataValue("owner");
const getCurrentParent = getDataValue("parent");

import { getQueryParameterByName } from "./helpers/queryStringParameter";

$(document).ready(function() {
  let $form = $(".form-upload");
  let $progressBar = $(".progress-bar");
  let $progress = $progressBar.find(".bar");
  let $percentage = $progressBar.find(".percent");

  let $modals = $(".modal");
  let $editModal = $(".edit-modal");
  let $deleteModal = $(".delete-modal");
  let $moveModal = $(".move-modal");
  let $renameModal = $(".rename-modal");
  let $newFileModal = $(".new-file-modal");

  let isCKEditor = window.location.href.indexOf("CKEditor=") !== -1;

  let currentFile = {};

  // TODO: replace with something cooler
  let reloadFiles = function() {
    window.location.reload();
  };

  function showAJAXSuccess(message) {
    $.showNotification(message, "success", 30000);
  }

  function showAJAXError(req, textStatus, errorThrown) {
    $deleteModal.modal("hide");
    $moveModal.modal("hide");
    if (textStatus === "timeout") {
      $.showNotification("Zeitüberschreitung der Anfrage", "warn");
    } else {
      $.showNotification(errorThrown, "danger");
    }
  }

  /**
   * gets the directory name of a file's fullPath (all except last path-part)
   * @param {string} fullPath - the fullPath of a file
   * **/
  function getDirname(fullPath) {
    return fullPath
      .split("/")
      .slice(0, -1)
      .join("/");
  }

  /** temp save for createdDirs, reset after reload **/
  let createdDirs = [];

  /** loads dropzone, if it exists on current page **/
  let progressBarActive = false;
  let finishedFilesSize = 0;
  $form.dropzone
    ? $form.dropzone({
        accept: function(file, done) {
          if (file.fullPath) {
            const promisePost = function(name, parent) {
              return new Promise(function(resolve, reject) {
                $.post("/files/directory", {
                  name: name,
                  owner: getOwnerId(),
                  parent: parent
                })
                  .done(resolve)
                  .fail(reject);
              });
            };

            const pathArray = file.fullPath.split("/");
            pathArray.pop();

            const lastPromise = pathArray.reduce(function(seq, name) {
              return seq
                .then(function(parent) {
                  return promisePost(name, parent._id);
                })
                .catch(() => undefined);
            }, Promise.resolve({ _id: getCurrentParent() }));

            lastPromise.then(function(result) {
              $.post(
                "/files/file",
                {
                  parent: result._id,
                  type: file.type,
                  filename: file.name
                },
                function(data) {
                  file.signedUrl = data.signedUrl;
                  file.parent = result._id;
                  done();
                }
              ).fail(showAJAXError);
            });

            return;
          }

          $.post(
            "/files/file",
            {
              parent: getCurrentParent(),
              type: file.type,
              filename: file.name
            },
            function(data) {
              file.signedUrl = data.signedUrl;
              file.parent = getCurrentParent();
              done();
            }
          ).fail(err => {
            this.removeFile(file);
            showAJAXError(
              err.responseJSON.error.code,
              err.responseJSON.error.message,
              `${err.responseJSON.error.name} - ${
                err.responseJSON.error.message
              }`
            );
          });
        },
        createImageThumbnails: false,
        method: "put",
        init: function() {
          // this is called on per-file basis
          this.on("processing", function(file) {
            if (!progressBarActive) {
              $progress.css("width", "0%");

              $form.fadeOut(50, function() {
                $progressBar.fadeIn(50);
              });

              progressBarActive = true;
            }

            this.options.url = file.signedUrl.url;
            this.options.headers = file.signedUrl.header;
          });

          this.on("sending", function(file, xhr, formData) {
            let _send = xhr.send;
            xhr.send = function() {
              _send.call(xhr, file);
            };
          });

          this.on("totaluploadprogress", function(progress, total, uploaded) {
            const realProgress =
              (uploaded + finishedFilesSize) /
              ((total + finishedFilesSize) / 100);

            $progress.stop().animate(
              { width: realProgress + "%" },
              {
                step: function(now) {
                  $percentage.html(Math.ceil(now) + "%");
                }
              }
            );
          });

          this.on("queuecomplete", function(file, response) {
            progressBarActive = false;
            finishedFilesSize = 0;

            $progressBar.fadeOut(50, function() {
              $form.fadeIn(50);
              showAJAXSuccess(
                "Datei(en) erfolgreich hinzugefügt und werden gleich nach einer Aktualisierung der Seite angezeigt."
              );
              setTimeout(function() {
                reloadFiles(); // waiting for success message
              }, 2000);
            });
          });

          this.on("success", function(file, response) {
            finishedFilesSize += file.size;
            var parentId = file.parent || getCurrentParent();
            var params = {
              name: file.name,
              owner: getOwnerId(),
              type: file.type,
              size: file.size,
              storageFileName: file.signedUrl.header["x-amz-meta-flat-name"],
              thumbnail: file.signedUrl.header["x-amz-meta-thumbnail"]
            };

            if (parentId) {
              params.parent = parentId;
            }

            // post file meta to proxy file service for persisting data
            $.post("/files/fileModel", params);

            this.removeFile(file);
          });

          this.on("dragover", function(file, response) {
            $form.addClass("focus");
          });

          this.on("dragleave", function() {
            $form.removeClass("focus");
          });

          this.on("dragend", function(file, response) {
            $form.removeClass("focus");
          });

          this.on("drop", function(file, response) {
            $form.removeClass("focus");
          });
        }
      })
    : "";

  $('a[data-method="download"]').on("click", function(e) {
    e.stopPropagation();
  });

  $('a[data-method="delete"]').on("click", function(e) {
    e.stopPropagation();
    e.preventDefault();
    let $buttonContext = $(this);

    $deleteModal.appendTo("body").modal("show");
    $deleteModal
      .find(".modal-title")
      .text(
        "Bist du dir sicher, dass du '" +
          $buttonContext.data("file-name") +
          "' löschen möchtest?"
      );

    $deleteModal
      .find(".btn-submit")
      .unbind("click")
      .on("click", function() {
        $.ajax({
          url: $buttonContext.attr("href"),
          type: "DELETE",
          data: {
            id: $buttonContext.data("file-id")
          },
          success: reloadFiles,
          error: showAJAXError
        });
      });
  });

  $deleteModal.find(".close, .btn-close").on("click", function() {
    $deleteModal.modal("hide");
  });

  $(".create-directory").on("click", function() {
    $editModal.appendTo("body").modal("show");
    $renameModal.modal("hide");
  });

  $(".new-file").on("click", function() {
    if (!window.location.href.includes("/courses/"))
      $("#student-can-edit-div").hide();
    $newFileModal.appendTo("body").modal("show");
  });

  $(".card.file").on("click", function() {
    if (isCKEditor)
      returnFileUrl($(this).data("file-id"), $(this).data("file-name"));
  });

  $(".card.file .title").on("click", function(e) {
    if (isCKEditor) {
      e.preventDefault();
      const $card = $(this).closest(".card.file");
      returnFileUrl($card.data("file-id"), $card.data("file-name"));
    }
  });

  $(".file-search").click(function() {
    let $input_field = $(this);
    let $parent = $input_field.parent().parent();

    // add filter fields below file-search-bar
    const filterOptions = [
      { key: "pics", label: "Bilder" },
      { key: "videos", label: "Videos" },
      { key: "pdfs", label: "PDF Dokumente" },
      { key: "msoffice", label: "Word/Excel/PowerPoint" }
    ];

    let $filterOptionsDiv = $('<div class="filter-options"></div>');

    filterOptions.forEach(fo => {
      let $newFilterOption = $(
        `<div data-key="${
          fo.key
        }" class="filter-option" onClick="location.href = '/files/search?filter=${
          fo.key
        }'"></div>`
      );
      let $newFilterLabel = $(`<span>Nach <b>${fo.label}</b> filtern</span>`);
      $newFilterOption.append($newFilterLabel);

      $filterOptionsDiv.append($newFilterOption);
    });

    $filterOptionsDiv.width($(".search-wrapper").width());
    $parent.append($filterOptionsDiv);
  });

  $(".file-search").blur(function(e) {
    setTimeout(function() {
      // wait for other events
      $(".filter-options").remove();
    }, 100);
  });

  $editModal.find(".modal-form").on("submit", function(e) {
    e.preventDefault();
    $.post(
      "/files/directory",
      {
        name: $editModal.find('[name="new-dir-name"]').val(),
        owner: getOwnerId(),
        parent: getCurrentParent()
      },
      function(data) {
        reloadFiles();
      }
    ).fail(showAJAXError);
  });

  $newFileModal.find(".modal-form").on("submit", function(e) {
    e.preventDefault();

    let studentEdit = false;
    if (document.getElementById("student-can-edit"))
      studentEdit = document.getElementById("student-can-edit").checked;
    $.post(
      "/files/newFile",
      {
        name: $newFileModal.find('[name="new-file-name"]').val(),
        type: $("#file-ending").val(),
        owner: getOwnerId(),
        parent: getCurrentParent(),
        studentEdit
      },
      function(data) {
        reloadFiles();
      }
    ).fail(showAJAXError);
  });

  $modals.find(".close, .btn-close").on("click", function() {
    $modals.modal("hide");
  });

  let returnFileUrl = (fileId, fileName) => {
    let fullUrl = "/files/file?file=" + fileId + "&name=" + fileName;
    let funcNum = getQueryParameterByName("CKEditorFuncNum");
    window.opener.CKEDITOR.tools.callFunction(funcNum, fullUrl);
    window.close();
  };

  $modals.find(".close, .btn-close").on("click", function() {
    $modals.modal("hide");
  });

  $(".file").mouseover(function(e) {
    let size = $(this).attr("data-file-size");
    let id = $(this).attr("data-file-id");

    $("#" + id).html(writeFileSizePretty(size));
  });

  $(".file").mouseout(function(e) {
    let id = $(this).attr("data-file-id");

    $("#" + id).html("");
  });

  const populateRenameModal = function(oldName, action, title) {
    let form = $renameModal.find(".modal-form");
    form.attr("action", action);

    populateModalForm($renameModal, {
      title: title,
      closeLabel: "Abbrechen",
      submitLabel: "Speichern",
      fields: {
        name: oldName
      }
    });

    $renameModal.modal("show");
  };

  $(".file-name-edit").click(function(e) {
    e.stopPropagation();
    e.preventDefault();
    let fileId = $(this).attr("data-file-id");
    let oldName = $(this).attr("data-file-name");

    populateRenameModal(
      oldName,
      "/files/fileModel/" + fileId + "/rename",
      "Datei umbenennen"
    );
  });

  if (!window.location.href.includes("/courses/"))
    $(".btn-student-allow").hide();

  $(".btn-student-allow").click(function(e) {
    const $button = $(this);
    e.stopPropagation();
    e.preventDefault();
    let fileId = $button.attr("data-file-id");
    let bool = $button.data("file-can-edit");

    $.ajax({
      type: "POST",
      url: "/files/studentCanEdit/",
      data: {
        id: fileId,
        bool: !bool
      },
      success: function(data) {
        if (data.success) {
          $button.data("file-can-edit", !bool);
          let id = e.target.id;
          if (!id.includes("ban")) id = `ban-${id}`;

          if ($(`#${id}`).is(":visible")) $(`#${id}`).hide();
          else {
            $(`#${id}`).removeAttr("hidden");
            $(`#${id}`).show();
          }
        }
      }
    });
  });

  $('a[data-method="dir-rename"]').on("click", function(e) {
    e.stopPropagation();
    e.preventDefault();
    let dirId = $(this).attr("data-directory-id");
    let oldName = $(this).attr("data-directory-name");

    populateRenameModal(
      oldName,
      "/files/directoryModel/" + dirId + "/rename",
      "Ordner umbenennen"
    );
  });

 	$(".btn-file-share").click(function(e) {
		e.stopPropagation();
		e.preventDefault();
		const fileId = $(this).attr("data-file-id");
		const $shareModal = $(".share-modal");
		fileShare(fileId, $shareModal);
	});

	$(".btn-file-settings").click(function(e) {
		e.stopPropagation();
		e.preventDefault();
		const fileId = $(this).attr("data-file-id");
		const $permissionModal = $(".permissions-modal");
		filePermissions(fileId, $permissionModal);
	});

	const filePermissions = function(fileId, $permissionModal) {
		const $loader = $permissionModal.find('.loader');
		const $table = $('.permissions-modal table');
		const $message = $('.permissions-modal p.message');

		$table.find('tbody').empty();
		$table.hide();
		$message.hide();
		$permissionModal.appendTo('body').modal('show');

		$.ajax({ url: `/files/permissions/?file=${fileId}`})
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
					}
				});

				$loader.hide();

				if( permissions && permissions.length ) {
					$table.find('tbody').html(
						permissions
							.reverse()
							.map(({name, write, read, refId}) => {
								return `<tr>
									<td>${nameMap[name] || name}</td>
									<td><input type="checkbox" name="read-${refId}" ${ typeof read === 'boolean' && read ? 'checked' : ''} ${ typeof read === 'undefined' ? 'disabled checked' : '' }/></td>
									<td><input type="checkbox" name="write-${refId}" ${ typeof write === 'boolean' && write ? 'checked' : ''} ${ typeof write === 'undefined' ? 'disabled checked' : '' }/></td>
								</tr>`;
							})
					);

					$table.on('click', 'input[type="checkbox"]', (e) => {
						const $input = $(e.target);
						const $colInputs = $table.find(`td:nth-child(${$input.parent().index() + 1}) input[type="checkbox"]`);
						const $inputIndex = $colInputs.index($input);

						if (!$input.prop('checked')) {
							$colInputs.each(function(idx){
								$(this).prop('checked', idx < $inputIndex);
							});
						}
					});

					$table.show();
				}
				else {
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

	const fileShare = (fileId, $shareModal, view) => {
		const $input = $shareModal.find('input[name="invitation"]');

		$input.click(() => {
			$(this).select();
		});
		$input.hide();

		$shareModal.appendTo('body').modal('show');

		$.ajax({ url: `/files/share/?file=${fileId}`})
			.then((result) => {
				const target = view ? `files/file/${fileId}/lool?share=${result.shareToken}` : `files/fileModel/${fileId}/proxy?share=${result.shareToken}`;
				return $.ajax({
					type: "POST",
					url: "/link/",
					data: { target },
				});
			})
			.then((link) => {

				populateModalForm($shareModal, {
					title: 'Freigabe-Link',
					closeLabel: 'Schließen',
					fields: {
						invitation: link.newUrl,
					}
				});

				$input.val(link.newUrl);
				$input.show();
			})
			.catch((err) => {
				console.log('error', err);
			});
	};

  const moveToDirectory = function(modal, targetId) {
    const fileId = modal
      .find(".modal-form")
      .find("input[name='fileId']")
      .val();

    $.ajax({
      url: "/files/file/" + fileId + "/move/",
      type: "POST",
      data: {
        parent: targetId
      },
      success: reloadFiles,
      error: showAJAXError
    });
  };

  const openSubTree = function(e) {
    const $parent = $(e.target).parent();
    const $parentDirElement = $parent.parent();
    const $toggle = $parent.find(".toggle-icon");
    const $subMenu = $parentDirElement.children(".dir-sub-menu");
    const isCollapsed = $toggle.hasClass("fa-plus-square-o");

    if (isCollapsed) {
      $subMenu.css("display", "block");
      $toggle.removeClass("fa-plus-square-o");
      $toggle.addClass("fa-minus-square-o");
    } else {
      $subMenu.css("display", "none");
      $toggle.removeClass("fa-minus-square-o");
      $toggle.addClass("fa-plus-square-o");
    }
  };

  let addDirTree = function($parent, dirTree, isMainFolder = true) {
    dirTree.forEach(d => {
      const $dirElement = $(
        `<div class="dir-element dir-${
          isMainFolder ? "main" : "sub"
        }-element" id="${d._id}" data-href="${d._id}"></div>`
      );

      const $dirHeader = $(
        `<div class="dir-header dir-${
          isMainFolder ? "main" : "sub"
        }-header"></div>`
      );
      const $toggle = $(
        `<i class="fa fa-plus-square-o toggle-icon"></i>`
      ).click(openSubTree);
      const $dirSpan = $(`<span>${d.name}</span>`).click(openSubTree);
      // just displayed on hovering parent element
      const $move = $(`<i class="fa ${d._id ? "fa-share" : ""}"></i>`).click(
        d._id ? moveToDirectory.bind(this, $moveModal, d._id) : ""
      );

      $dirHeader.append($toggle);
      $dirHeader.append($dirSpan);
      $dirHeader.hover(
        function() {
          $move.css("display", "inline");
        },
        function() {
          $move.css("display", "none");
        }
      );
      $dirHeader.append($move);

      $dirElement.append($dirHeader);

      if (d.children && d.children.length) {
        const $newList = $('<div class="dir-sub-menu"></div>');
        addDirTree($newList, d.children, false);
        $dirElement.append($newList);
      } else {
        $toggle.css("visibility", "hidden");
      }
      $parent.append($dirElement);
    });
  };

	$('.btn-file-move').on('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    let $context = $(this);

    populateModalForm($moveModal, {
      title: "Datei verschieben",
      fields: {
        fileId: $context.attr("data-file-id"),
        fileName: $context.attr("data-file-name"),
        filePath: $context.attr("data-file-path")
      }
    });

    $moveModal.find(".modal-footer").empty();
    $moveModal.appendTo("body").modal("show");

    const $loader = $moveModal.find(".loader");
    let $dirTreeList = $moveModal.find(".dir-main-menu");
    let $dirTree = $moveModal.find(".directories-tree");

    if (!$dirTreeList.length) {
      $loader.show();
      // fetch all directories the user is permitted to access
      $.getJSON("/files/permittedDirectories/", function(result) {
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
let $openModal = $(".open-modal");

window.videoClick = function videoClick(e) {
  e.stopPropagation();
  e.preventDefault();
};

const fileTypes = {
  docx:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx:
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  xls: "application/vnd.ms-excel",
  doc: "application/vnd.ms-word",
  odt: "application/vnd.oasis.opendocument.text",
  txt: "text/plain",
  pdf: "application/pdf"
};

window.fileViewer = function fileViewer(type, name, id) {
  $('#my-video').css('display', 'none');

  // detect filetype according to line ending
  if (type.length === 0) {
    let fType = name.split('.');
    type = fileTypes[fType[fType.length - 1]] || '';
  }

  switch (type) {
    case 'application/pdf':
      $('#file-view').hide();
      win = window.open(`/files/file?file=${id}`, '_blank');
      win.focus();
      break;

	case `image/${type.substr(6)}`:
	  location.href='#file-view';
      $('#file-view').css('display', '');
      $('#picture').attr('src', `/files/file?file=${id}&name=${name}`);
      break;

    case `audio/${type.substr(6)}`:
	case `video/${type.substr(6)}`:
	location.href='#file-view';
      $('#file-view').css('display', '');
      videojs('my-video').ready(function() {
        this.src({ type: type, src: `/files/file?file=${id}`});
      });
      $('#my-video').css('display', '');
      break;

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': //.docx
    case 'application/vnd.ms-word':
    case 'application/msword': //.doc
    case 'application/vnd.oasis.opendocument.text': //.odt
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': //.xlsx
    case 'application/vnd.ms-excel':
    case 'application/msexcel': //.xls
    case 'application/vnd.oasis.opendocument.spreadsheet': //.ods
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': //.pptx
    case 'application/vnd.ms-powerpoint':
    case 'application/mspowerpoint': //.ppt
    case 'application/vnd.oasis.opendocument.presentation': //.odp
    case 'text/plain': //.txt
      $('#file-view').hide();
      win = window.open(`/files/file/${id}/lool`, '_self');
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
 **/
function openInIframe(source) {
  $("input.box").each(function() {
    let mycookie = $.cookie($(this).attr("name"));
    if (mycookie && mycookie == "true") {
      $(this).prop("checked", mycookie);
      $("#link").html(
        '<iframe class="vieweriframe" src=' +
          source +
          ">" +
          "<p>Dein Browser unterstützt dies nicht.</p></iframe>"
      );
      $("#link").css("display", "");
    } else {
      $openModal.appendTo("body").modal("show");
      $openModal
        .find(".btn-submit")
        .unbind("click")
        .on("click", function() {
          $.cookie(
            $("input.box").attr("name"),
            $("input.box").prop("checked"),
            {
              path: "/",
              expires: 365
            }
          );

          $("#link").html(
            '<iframe class="vieweriframe" src=' +
              source +
              ">" +
              "<p>Dein Browser unterstützt dies nicht.</p></iframe>"
          );
          $("#link").css("display", "");
          $openModal.modal("hide");
        });

      $openModal
        .find(".close, .btn-close")
        .unbind("click")
        .on("click", function() {
          $openModal.modal("hide");
          window.location.href = "#_";
        });
    }
  });
}

function writeFileSizePretty(filesize) {
  let unit;
  let iterator = 0;

  while (filesize > 1024) {
    filesize = Math.round((filesize / 1024) * 100) / 100;
    iterator++;
  }
  switch (iterator) {
    case 0:
      unit = "B";
      break;
    case 1:
      unit = "KB";
      break;
    case 2:
      unit = "MB";
      break;
    case 3:
      unit = "GB";
      break;
    case 4:
      unit = "TB";
      break;
  }
  return filesize + unit;
}
