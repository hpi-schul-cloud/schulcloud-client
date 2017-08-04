function getCurrentDir() {
    return $('.section-upload').data('path');
}

$(document).ready(function() {
    var $form = $(".form-upload");
    var $progressBar = $('.progress-bar');
    var $progress = $progressBar.find('.bar');
    var $percentage = $progressBar.find('.percent');

    var $modals = $('.modal');
    var $editModal = $('.edit-modal');
    var $deleteModal = $('.delete-modal');
    var $moveModal = $('.move-modal');

    var isCKEditor = window.location.href.indexOf('CKEditor=') != -1;

    // TODO: replace with something cooler
    var reloadFiles = function () {
        window.location.reload();
    };

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


    let progressBarActive = false;
    let finishedFilesSize = 0;
    $form.dropzone({
        accept: function (file, done) {
            // get signed url before processing the file
            // this is called on per-file basis
            var currentDir = getCurrentDir();
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
                var _send = xhr.send;
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
                    reloadFiles();
                });
            });

            this.on("success", function (file, response) {
                finishedFilesSize += file.size;

                // post file meta to proxy file service for persisting data
                $.post('/files/fileModel', {
                    key: file.signedUrl.header['x-amz-meta-path'] + '/' + file.name,
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
    });

    $('a[data-method="download"]').on('click', function (e) {
        e.stopPropagation();
    });

    $('a[data-method="delete"]').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        var $buttonContext = $(this);

        $deleteModal.modal('show');
        $deleteModal.find('.modal-title').text("Bist du dir sicher, dass du '" + $buttonContext.data('file-name') + "' löschen möchtest?");

        $deleteModal.find('.btn-submit').unbind('click').on('click', function () {
            $.ajax({
                url: $buttonContext.attr('href'),
                type: 'DELETE',
                data: {
                    name: $buttonContext.data('file-name'),
                    dir: $buttonContext.data('file-path')
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

    /**$('a[data-method="move"]').on('click', function(e) {
	e.stopPropagation();
	e.preventDefault();
	var $buttonContext = $(this);

	$moveModal.modal('show');
	$moveModal.find('.btn-submit').unbind('click').on('click', function() {
	$.ajax({
	url: $buttonContext.attr('href'),
	type: 'MOVE',
	data: {
	name: $buttonContext.data('file-name'),
	dir: $buttonContext.data('file-path')
},
success: function(result) {
reloadFiles();
},
error: showAJAXError
});
});
});

     $moveModal.find('.close, .btn-close').on('click', function() {
$moveModal.modal('hide');
});**/


    $('.create-directory').on('click', function () {
        $editModal.modal('show');
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

    $editModal.find('.modal-form').on('submit', function (e) {
        e.preventDefault();
        $.post('/files/directory', {
            name: $editModal.find('[name="new-dir-name"]').val(),
            dir: getCurrentDir()
        }, function (data) {
            reloadFiles();
        }).fail(showAJAXError);
    });


    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');

    });

    var returnFileUrl = (fileName) => {
        var fullUrl = '/files/file?path=' + getCurrentDir() + fileName;
        var funcNum = getQueryParameterByName('CKEditorFuncNum');
        window.opener.CKEDITOR.tools.callFunction(funcNum, fullUrl);
        window.close();
    };

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });

    $('.btn-file-share').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let path = $(this).attr('data-file-path');
        let $shareModal = $('.share-modal');
        $.ajax({
            type: "POST",
            url: "/files/permissions/",
            data: {
                key: path
            },
            success: function(data) {
                let target = `files/file?path=${data.key}&share=${data.shareToken}`;
                $.ajax({
                    type: "POST",
                    url: "/link/",
                    data: {
                        target: target
                    },
                    success: function(data) {
                        populateModalForm($shareModal, {
                            title: 'Einladungslink generiert!',
                            closeLabel: 'Schließen',
                            submitLabel: 'Speichern',
                            fields: {invitation: data.newUrl}
                        });
                        $shareModal.find('.btn-submit').remove();
                        $shareModal.find("input[name='invitation']").click(function () {
                            $(this).select();
                        });

                        $shareModal.modal('show');

                    }
                });
            }
        });
    });

});
var $openModal = $('.open-modal');

function videoClick(e) {
    e.stopPropagation();
    e.preventDefault();
}

function fileViewer(filetype, file, key) {
    $('#my-video').css("display","none");
    switch (filetype) {
        case 'application/pdf':
            $('#file-view').hide();
            var win = window.open('/files/file?file='+file, '_blank');
            win.focus();
            break;

        case 'image/'+filetype.substr(6) :
            $('#file-view').css('display','');
            $('#picture').attr("src", '/files/file?file='+file);
            break;

        case 'audio/'+filetype.substr(6):
        case 'video/'+filetype.substr(6):
            $('#file-view').css('display','');
            videojs('my-video').ready(function () {
                this.src({type: filetype, src: '/files/file?file='+file});
            });
            $('#my-video').css("display","");
            break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':     //.docx
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':           //.xlsx
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':   //.pptx
        case 'application/vnd.ms-powerpoint':                                               //.ppt
        case 'application/vnd.ms-excel':                                                    //.xlx
        case 'application/vnd.ms-word':                                                     //.doc
            //todo: msviewer nimmt gültige signed URL nicht an
        /**    $('#file-view').css('display','');
         var msviewer = "https://view.officeapps.live.com/op/embed.aspx?src=";
         $openModal.find('.modal-title').text("Möchtest du diese Datei mit dem externen Dienst Microsoft Office Online ansehen?");
         file = file.substring(file.lastIndexOf('/')+1);
	 
         $.post('/files/file?file=', {
                path: getCurrentDir() + file,
                type: filetype,
                action: "getObject"
            }, function (data) {
                var url = data.signedUrl.url;
                url = url.replace(/&/g, "%26");
                openInIframe(msviewer+url);
            })
         .fail(showAJAXError);
         break;**/
        case 'text/plain': //only in Google Docs Viewer                                     //.txt
        //case 'application/x-zip-compressed':                                                //.zip
            $('#file-view').css('display','');
            var gviewer ="https://docs.google.com/viewer?url=";
            $openModal.find('.modal-title').text("Möchtest du diese Datei mit dem externen Dienst Google Docs Viewer ansehen?");
            file = file.substring(file.lastIndexOf('/')+1);
		    
            $.post('/files/file?file=', {
                path: getCurrentDir() + file,
                type: filetype,
                action: "getObject"
            }, function (data) {
                var url = data.signedUrl.url;
                url = url.replace(/&/g, "%26");
                openInIframe(gviewer+url+"&embedded=true");
            })
                .fail(showAJAXError);
            break;

        default:
            $('#file-view').css('display','');
            $('#link').html('<a class="link" href="/files/file?file='+file+'" target="_blank">Datei extern öffnen</a>');
            $('#link').css("display","");
    }
}

//show Google-Viewer/Office online in iframe, after user query (and set cookie)
function openInIframe(source){
    $("input.box").each(function() {
        var mycookie = $.cookie($(this).attr('name'));
        if (mycookie && mycookie == "true") {
            $(this).prop('checked', mycookie);
            $('#link').html('<iframe class="vieweriframe" src='+source+'>' +
                '<p>Dein Browser unterstützt dies nicht.</p></iframe>');
            $('#link').css("display","");
        }
        else {
            $openModal.modal('show');
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
    var unit;
    var iterator = 0;

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

