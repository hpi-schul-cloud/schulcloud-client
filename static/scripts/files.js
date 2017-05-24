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

    function getCurrentDir() {
        return $('.section-upload').data('path');
    }

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
                this.options.url = file.signedUrl.url;
                this.options.headers = file.signedUrl.header;
                $progress.css('width', '0%');
                $form.fadeOut(50, function () {
                    $progressBar.fadeIn(50);
                });
            });

            this.on("sending", function (file, xhr, formData) {
                var _send = xhr.send;
                xhr.send = function () {
                    _send.call(xhr, file);
                };
            });

            this.on("totaluploadprogress", function (progress) {
                $progress.stop().animate({'width': progress + '%'}, {
                    step: function (now) {
                        $percentage.html(Math.ceil(now) + '%');
                    },
                    complete: function () {
                        $progressBar.fadeOut(50, function () {
                            $form.fadeIn(50);
                            reloadFiles();
                        });
                    }
                });
            });

            this.on("totaluploadprogress", function (progress) {
                $progress.stop().animate({'width': progress + '%'}, {
                    step: function (now) {
                        $percentage.html(Math.ceil(now) + '%');
                    },
                    complete: function () {
                        $progressBar.fadeOut(50, function () {
                            $form.fadeIn(50);
                            reloadFiles();
                        });
                    }
                });
            });

            this.on("success", function (file, response) {
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

});
    function videoClick(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    function fileViewer(filetype, file) {
        document.getElementById('my-video').style.display = "none";
        document.getElementById('link').style.display = "none";

        switch (filetype) {
            case 'image/'+filetype.substr(6, filetype.length) :
                document.getElementById('picture').src = '/files/file?file='+file;
                break;
            case 'audio/'+filetype.substr(6, filetype.length):
            case 'video/'+filetype.substr(6, filetype.length):
                videojs('my-video').ready(function () {
                    this.src({type: filetype, src: '/files/file?file='+file});
                });
                document.getElementById('my-video').style.display = "";
                break;
            default:
                document.getElementById('link').innerHTML='<a class="link" href="/files/file?file='+file+'" target="_blank">Datei extern öffnen</a>'
                document.getElementById('link').style.display = "";
        }
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

