/* global videojs */
import { getQueryParameterByName } from './helpers/queryStringParameter';

function getCurrentDir() {
    return $('.section-upload').data('path');
}
$(document).ready(function() {
    let $form = $(".form-upload");
    let $progressBar = $('.progress-bar');
    let $progress = $progressBar.find('.bar');
    let $percentage = $progressBar.find('.percent');

    let $modals = $('.modal');
    let $editModal = $('.edit-modal');
    let $deleteModal = $('.delete-modal');
    let $moveModal = $('.move-modal');
    let $renameModal = $('.rename-modal');
    let $newFileModal = $('.new-file-modal');

    let isCKEditor = window.location.href.indexOf('CKEditor=') !== -1;

    // TODO: replace with something cooler
    let reloadFiles = function () {
        window.location.reload();
    };

    function showAJAXSuccess(message) {
        $.showNotification(message, "success", 30000);
    }

    function showAJAXError(req, textStatus, errorThrown) {
        $deleteModal.modal('hide');
        $moveModal.modal('hide');
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
        return fullPath.split("/").slice(0, -1).join('/');
    }


    /** loads dropzone, if it exists on current page **/
    let progressBarActive = false;
    let finishedFilesSize = 0;
    $form.dropzone ? $form.dropzone({
        accept: function (file, done) {
            // get signed url before processing the file
            // this is called on per-file basis

            let currentDir = getCurrentDir();

            $.post('/files/file', {
                path: currentDir + file.name,
                type: file.type
            }, function (data) {
                file.signedUrl = data.signedUrl;
                done();
            })
                .fail(showAJAXError);
        },
        createImageThumbnails: false,
        method: 'put',
        init: function () {
            // this is called on per-file basis
            this.on("processing", function (file) {
                if(!progressBarActive) {
                    $progress.css('width', '0%');

                    $form.fadeOut(50, function () {
                        $progressBar.fadeIn(50);
                    });

                    progressBarActive = true;
                }

                this.options.url = file.signedUrl.url;
                this.options.headers = file.signedUrl.header;
            });

            this.on("sending", function (file, xhr, formData) {
                let _send = xhr.send;
                xhr.send = function () {
                    _send.call(xhr, file);
                };
            });

            this.on("totaluploadprogress", function (progress, total, uploaded) {
                const realProgress = (uploaded + finishedFilesSize) / ((total + finishedFilesSize) / 100);

                $progress.stop().animate({'width': realProgress + '%'}, {
                    step: function (now) {
                        $percentage.html(Math.ceil(now) + '%');
                    }
                });
            });

            this.on("queuecomplete", function (file, response) {
                progressBarActive = false;
                finishedFilesSize = 0;

                $progressBar.fadeOut(50, function () {
                    $form.fadeIn(50);
                    showAJAXSuccess("Datei(en) erfolgreich hinzugefügt und werden gleich nach einer Aktualisierung der Seite angezeigt.");
                    setTimeout(function () {
                        reloadFiles(); // waiting for success message
                    }, 2000);
                });
            });

            this.on("success", function (file, response) {
                finishedFilesSize += file.size;

                // post file meta to proxy file service for persisting data
                $.post('/files/fileModel', {
                    key: file.signedUrl.header['x-amz-meta-path'] + '/' + encodeURIComponent(file.name),
                    path: file.signedUrl.header['x-amz-meta-path'] + '/',
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    flatFileName: file.signedUrl.header['x-amz-meta-flat-name'],
                    thumbnail: file.signedUrl.header['x-amz-meta-thumbnail']
                });

                this.removeFile(file);

            });

            this.on("dragover", function (file, response) {
                $form.addClass('focus');
            });

            this.on("dragleave", function () {
                $form.removeClass('focus');
            });

            this.on("dragend", function (file, response) {
                $form.removeClass('focus');
            });

            this.on("drop", function (file, response) {
                $form.removeClass('focus');
            });
        }
    }) : '';

    $('a[data-method="download"]').on('click', function (e) {
        e.stopPropagation();
    });

    $('a[data-method="delete"]').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        let $buttonContext = $(this);

        $deleteModal.appendTo('body').modal('show');
        $deleteModal.find('.modal-title').text("Bist du dir sicher, dass du '" + $buttonContext.data('file-name') + "' löschen möchtest?");

        $deleteModal.find('.btn-submit').unbind('click').on('click', function () {
            $.ajax({
                url: $buttonContext.attr('href'),
                type: 'DELETE',
                data: {
                    key: $buttonContext.data('file-key')
                },
                success: function (result) {
                    reloadFiles();
                },
                error: showAJAXError
            });
        });
    });

    $deleteModal.find('.close, .btn-close').on('click', function () {
        $deleteModal.modal('hide');
    });

    $('.create-directory').on('click', function () {
        $editModal.appendTo('body').modal('show');
        $renameModal.modal('hide');
    });

    $('.new-file').on('click', function () {
        if (!window.location.href.includes('/courses/'))
            $('#student-can-edit-div').hide();
        $newFileModal.appendTo('body').modal('show');
    });

    $('.card.file').on('click', function () {
        if (isCKEditor) returnFileUrl($(this).data('file-name'));
    });

    $('.card.file .title').on('click', function (e) {
        if (isCKEditor) {
            e.preventDefault();
            returnFileUrl($(this).closest('.card.file').data('file-name'));
        }
    });

    $('.file-search').click(function () {
        let $input_field =  $(this);
        let $parent = $input_field.parent().parent();

        // add filter fields below file-search-bar
        const filterOptions = [
            {key: 'pics', label: 'Bilder'},
            {key: 'videos', label: 'Videos'},
            {key: 'pdfs', label: 'PDF Dokumente'},
            {key: 'msoffice', label: 'Word/Excel/PowerPoint'}
        ];

        let $filterOptionsDiv = $('<div class="filter-options"></div>');

        filterOptions.forEach(fo => {
            let $newFilterOption = $(`<div data-key="${fo.key}" class="filter-option" onClick="location.href = '/files/search?filter=${fo.key}'"></div>`);
            let $newFilterLabel = $(`<span>Nach <b>${fo.label}</b> filtern</span>`);
            $newFilterOption.append($newFilterLabel);

            $filterOptionsDiv.append($newFilterOption);
        });

        $filterOptionsDiv.width($('.search-wrapper').width());
        $parent.append($filterOptionsDiv);
    });

    $('.file-search').blur(function (e) {
        setTimeout(function() {
            // wait for other events
            $('.filter-options').remove();
        }, 100);

    });

    $editModal.find('.modal-form').on('submit', function (e) {
        e.preventDefault();
        $.post('/files/directory', {
            name: $editModal.find('[name="new-dir-name"]').val(),
            dir: getCurrentDir()
        }, function (data) {
            reloadFiles();
        }).fail(showAJAXError);
    });

    $newFileModal.find('.modal-form').on('submit', function (e) {
        e.preventDefault();

        let studentEdit = false;
        if (document.getElementById('student-can-edit'))
            studentEdit = document.getElementById('student-can-edit').checked;
        $.post('/files/newFile', {
            name: $newFileModal.find('[name="new-file-name"]').val(),
            type: $("#file-ending").val(),
            dir: getCurrentDir(),
            studentEdit
        }, function (data) {
            reloadFiles();
        }).fail(showAJAXError);
    });


    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');

    });

    let returnFileUrl = (fileName) => {
        let fullUrl = '/files/file?path=' + getCurrentDir() + fileName;
        let funcNum = getQueryParameterByName('CKEditorFuncNum');
        window.opener.CKEDITOR.tools.callFunction(funcNum, fullUrl);
        window.close();
    };

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });

    $('.file').mouseover(function (e) {
        let size = $(this).attr('data-file-size');
        let id = $(this).attr('data-file-id');

        $('#' + id).html(writeFileSizePretty(size));
        $(this).find('.file-name-edit').css('display', 'inline');
    });

    $('.file').mouseout(function (e) {
        let id = $(this).attr('data-file-id');

        $('#' + id).html('');
        $(this).find('.file-name-edit').css('display', 'none');
    });

    let populateRenameModal = function(oldName, path, action, title) {
        let form = $renameModal.find('.modal-form');
        form.attr('action', action);

        populateModalForm($renameModal, {
            title: title,
            closeLabel: 'Abbrechen',
            submitLabel: 'Speichern',
            fields: {
                name: oldName,
                path: path,
                key: path + oldName
            }
        });

        $renameModal.modal('show');
    };

    $('.file-name-edit').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let fileId = $(this).attr('data-file-id');
        let oldName = $(this).attr('data-file-name');
        let path = $(this).attr('data-file-path');

        populateRenameModal(
            oldName,
            path,
            '/files/fileModel/' + fileId +  '/rename',
            'Datei umbenennen');
    });

    if (!window.location.href.includes('/courses/'))
        $('.btn-student-allow').hide();

    $('.btn-student-allow').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let fileId = $(this).attr('data-file-id');
        let bool = $(this).attr('data-file-can-edit') || false;
        bool = bool == 'true';

        $.ajax({
            type: "POST",
            url: "/files/studentCanEdit/",
            data: {
                id: fileId,
                bool: !bool
            },
            success: function (data) {
                if (data.success) {
                    let id = e.target.id;
                    if (!id.includes('ban'))
                        id = `ban-${id}`;

                    if ($(`#${id}`).is(":visible"))
                        $(`#${id}`).hide();
                    else {
                        $(`#${id}`).removeAttr('hidden');
                        $(`#${id}`).show();
                    }
                }
            }
        });
    });

    $('a[data-method="dir-rename"]').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        let dirId = $(this).attr('data-directory-id');
        let oldName = $(this).attr('data-directory-name');
        let path = $(this).attr('data-directory-path');

        populateRenameModal(
            oldName,
            path,
            '/files/directoryModel/' + dirId +  '/rename',
            'Ordner umbenennen');
    });

    $('.btn-file-share-close').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let id = e.target.parentElement.id;
        $(`.popup-overlay#${id}, .popup-content#${id}`).removeClass("active");
    });

    $('.btn-file-share-view').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let fileId = $(this).attr('data-file-id');
        let $shareModal = $('.share-modal');
        let id = e.target.parentElement.id;
        $(`.popup-overlay#${id}, .popup-content#${id}`).removeClass("active");

        fileShare(fileId, $shareModal, true);
    });

    $('.btn-file-share-download').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let fileId = $(this).attr('data-file-id');
        let $shareModal = $('.share-modal');
        let id = e.target.parentElement.id;
        $(`.popup-overlay#${id}, .popup-content#${id}`).removeClass("active");

        fileShare(fileId, $shareModal);
    });

    $('.btn-file-share').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let fileId = $(this).attr('data-file-id');
        let fileName = $(this).attr('data-file-name');
        let $shareModal = $('.share-modal');
        let id = e.target.parentElement.id;

        let fType = fileName.split('.');
        fType = fileTypes[fType[fType.length - 1]];

        if (fType && fType !== 'application/pdf')
            $(`.popup-overlay#${id}, .popup-content#${id}`).addClass("active");
        else {
            fileShare(fileId, $shareModal);
        }
    });

    const fileShare = (fileId, $shareModal, view) => {
        $.ajax({
            type: "POST",
            url: "/files/permissions/",
            data: {
                id: fileId
            },
            success: function (data) {
                let target = view ? `files/file/${fileId}/lool?share=${data.shareToken}` : `files/fileModel/${data._id}/proxy?share=${data.shareToken}`;
                $.ajax({
                    type: "POST",
                    url: "/link/",
                    data: {
                        target: target
                    },
                    success: function (data) {
                        populateModalForm($shareModal, {
                            title: 'Freigabe Einstellungen',
                            closeLabel: 'Abbrechen',
                            submitLabel: 'Speichern',
                            fields: {invitation: data.newUrl}
                        });
                        $shareModal.find('.btn-submit').remove();
                        $shareModal.find("input[name='invitation']").click(function () {
                            $(this).select();
                        });

                        $shareModal.appendTo('body').modal('show');

                    }
                });
            }
        });
    };

    $moveModal.on('hidden.bs.modal', function () {
        // delete the directory-tree
        $('.directories-tree').empty();
    });

    let moveToDirectory = function (modal, path) {
        let fileId = modal.find('.modal-form').find("input[name='fileId']").val();
        let fileName = modal.find('.modal-form').find("input[name='fileName']").val();
        let fileOldPath = modal.find('.modal-form').find("input[name='filePath']").val();

        $.ajax({
            url: '/files/file/' + fileId + '/move/',
            type: 'POST',
            data: {
                fileName: fileName,
                oldPath: fileOldPath,
                newPath: path
            },
            success: function (result) {
                reloadFiles();
            },
            error: showAJAXError
        });
    };

    let openSubTree = function (e) {
        let $parent = $(e.target).parent();
        let $parentDirElement = $parent.parent();
        let $toggle = $parent.find('.toggle-icon');
        let $subMenu = $parentDirElement.children('.dir-sub-menu');
        let isCollapsed = $toggle.hasClass('fa-plus-square-o');

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

    let addDirTree = function ($parent, dirTree, isMainFolder = true) {
        dirTree.forEach(d => {
           let $dirElement =  $(`<div class="dir-element dir-${isMainFolder ? 'main' : 'sub'}-element" id="${d.path}" data-href="${d.path}"></div>`);

           let $dirHeader = $(`<div class="dir-header dir-${isMainFolder ? 'main' : 'sub'}-header"></div>`);
           let $toggle = $(`<i class="fa fa-plus-square-o toggle-icon"></i>`)
               .click(openSubTree.bind(this));
           let $dirSpan = $(`<span>${d.name}</span>`)
               .click(openSubTree.bind(this));
           // just displayed on hovering parent element
           let $move = $(`<i class="fa ${d.path ? 'fa-share' :''}"></i>`)
               .click(d.path ? moveToDirectory.bind(this, $moveModal, d.path): '');

           $dirHeader.append($toggle);
           $dirHeader.append($dirSpan);
           $dirHeader.hover(function() {
               $move.css('display', 'inline');
           }, function () {
               $move.css('display', 'none');
           });
           $dirHeader.append($move);

           $dirElement.append($dirHeader);

           if (d.subDirs.length) {
               let $newList = $('<div class="dir-sub-menu"></div>');
               addDirTree($newList, d.subDirs, false);
               $dirElement.append($newList);
           } else {
               $toggle.css('visibility', 'hidden');
           }
           $parent.append($dirElement);
        });
    };

    $('.btn-file-move').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let $context = $(this);

        // fetch all directories the user is permitted to access
        $.getJSON('/files/permittedDirectories/', function (result) {
            populateModalForm($moveModal, {
                title: 'Datei verschieben',
                fields: {
                    fileId: $context.attr('data-file-id'),
                    fileName: $context.attr('data-file-name'),
                    filePath: $context.attr('data-file-path')
                }
            });

            // add folder structure recursively
            let $dirTree = $('.directories-tree');
            let $dirTreeList = $('<div class="dir-main-menu"></div>');
            addDirTree($dirTreeList, result);
            $dirTree.append($dirTreeList);
            // remove modal-footer
            $moveModal.find('.modal-footer').empty();
            $moveModal.appendTo('body').modal('show');
        });
    });

});
let $openModal = $('.open-modal');

window.videoClick = function videoClick(e) {
    e.stopPropagation();
    e.preventDefault();
};

const fileTypes = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ppt: 'application/vnd.ms-powerpoint',
    xls: 'application/vnd.ms-excel',
    doc: 'application/vnd.ms-word',
    odt: 'application/vnd.oasis.opendocument.text',
    txt: 'text/plain',
    pdf: 'application/pdf'
};

window.fileViewer = function fileViewer(type, key, name, id) {
    $('#my-video').css("display" , "none");

    // detect filetype according to line ending
    if (type.length === 0) {
        let fType = name.split('.');
        type = fileTypes[fType[fType.length - 1]];
    }

    switch (type) {
        case 'application/pdf':
            $('#file-view').hide();
            let win = window.open('/files/file?file=' + key, '_blank');
            win.focus();
            break;

        case 'image/' + type.substr(6) :
            $('#file-view').css('display','');
            $('#picture').attr("src", '/files/file?file=' + key);
            break;

        case 'audio/' + type.substr(6):
        case 'video/' + type.substr(6):
            $('#file-view').css('display','');
            videojs('my-video').ready(function () {
                this.src({type: type, src: '/files/file?file=' + key});
            });
            $('#my-video').css("display","");
            break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':     //.docx
        case 'application/vnd.ms-word': case 'application/msword':                          //.doc
        case 'application/vnd.oasis.opendocument.text':	                                    //.odt
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':           //.xlsx
        case 'application/vnd.ms-excel': case 'application/msexcel':                        //.xls
        case 'application/vnd.oasis.opendocument.spreadsheet':	                            //.ods
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':   //.pptx
        case 'application/vnd.ms-powerpoint':  case 'application/mspowerpoint':             //.ppt
        case 'application/vnd.oasis.opendocument.presentation':	                            //.odp
        case 'text/plain':                                                                  //.txt
            $('#file-view').hide();
            win = window.open(`/files/file/${id}/lool`, '_blank');
            win.focus();

            break;

            /**
             * GViewer still needed?
            $('#file-view').css('display','');
            let gviewer = "https://docs.google.com/viewer?url=";
            let showAJAXError = showAJAXError; // for deeply use
            $openModal.find('.modal-title').text("Möchtest du diese Datei mit dem externen Dienst Google Docs Viewer ansehen?");
            $.post('/files/file?file=', {
                path: (getCurrentDir()) ? getCurrentDir() + name : key,
                type: type,
                action: "getObject"
            }, function (data) {
                let url = data.signedUrl.url;
                url = url.replace(/&/g, "%26");
                openInIframe(gviewer + url + "&embedded=true");
            })
                .fail(showAJAXError);
            break;
             **/

        default:
            $('#file-view').css('display','');
            $('#link').html('<a class="link" href="/files/file?file=' + key + '" target="_blank">Datei extern öffnen</a>');
            $('#link').css("display","");
    }
};

/**
 * Show Google-Viewer/Office online in iframe, after user query (and set cookie)
 * @deprecated
**/
function openInIframe(source){
    $("input.box").each(function() {
        let mycookie = $.cookie($(this).attr('name'));
        if (mycookie && mycookie == "true") {
            $(this).prop('checked', mycookie);
            $('#link').html('<iframe class="vieweriframe" src='+source+'>' +
                '<p>Dein Browser unterstützt dies nicht.</p></iframe>');
            $('#link').css("display","");
        }
        else {
            $openModal.appendTo('body').modal('show');
            $openModal.find('.btn-submit').unbind('click').on('click', function () {
                $.cookie($("input.box").attr("name"), $("input.box").prop('checked'), {
                    path: '/',
                    expires: 365
                });

                $('#link').html('<iframe class="vieweriframe" src='+source+'>' +
                    '<p>Dein Browser unterstützt dies nicht.</p></iframe>');
                $('#link').css("display","");
                $openModal.modal('hide');
            });

            $openModal.find('.close, .btn-close').unbind('click').on('click', function () {
                $openModal.modal('hide');
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
    return (filesize + unit);
}

