$(document).ready(function() {
    var $form = $(".form-upload");
    var $progressBar = $('.progress-bar');
    var $progress = $progressBar.find('.bar');
    var $percentage = $progressBar.find('.percent');

    var $modals = $('.modal');
    var $editModal = $('.edit-modal');
    var $deleteModal = $('.delete-modal');

    // TODO: replace with something cooler
    var reloadFiles = function() {
        window.location.reload();
    };

    function showAJAXError(req, textStatus, errorThrown) {
        $deleteModal.modal('hide');
        if(textStatus==="timeout") {
            $.showNotification("Zeitüberschreitung der Anfrage", "warn");
        } else {
            $.showNotification(errorThrown, "danger");
        }
    }

    $form.dropzone({
        accept: function(file, done) {
            // get signed url before processing the file
            // this is called on per-file basis

            var currentDir = getQueryParameterByName('dir');

            $.post('/files/file', {
                name: file.name,
                dir: currentDir,
                type: file.type
            }, function(data) {
                file.signedUrl = data.signedUrl;
                done();
            })
                .fail(showAJAXError);
        },
        createImageThumbnails: false,
        method: 'put',
        init: function() {
            // this is called on per-file basis
            this.on("processing", function(file) {
                this.options.url = file.signedUrl.url;
                this.options.headers = file.signedUrl.header;
                $progress.css('width', '0%');
                $form.fadeOut(50, function(){
                    $progressBar.fadeIn(50);
                });
            });

            this.on("sending", function(file, xhr, formData) {
                var _send = xhr.send;
                xhr.send = function() {
                    _send.call(xhr, file);
                };
            });

            this.on("totaluploadprogress", function(progress) {
                $progress.stop().animate({'width': progress + '%'}, {
                    step: function(now) {
                        $percentage.html(Math.ceil(now) + '%');
                    },
                    complete: function() {
                        $progressBar.fadeOut(50, function() {
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


    $('a[data-method="delete"]').on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var $buttonContext = $(this);

        $deleteModal.modal('show');
        $deleteModal.find('.modal-title').text("Bist du dir sicher, dass du '" + $buttonContext.data('file-name') + "' löschen möchtest?");
        
        $deleteModal.find('.btn-submit').unbind('click').on('click', function() {
            $.ajax({
                url: $buttonContext.attr('href'),
                type: 'DELETE',
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

    $deleteModal.find('.close, .btn-close').on('click', function() {
        $deleteModal.modal('hide');
    });

    $('.create-directory').on('click', function(){
        $editModal.modal('show');
    });

    $editModal.find('.modal-form').on('submit', function(e) {
        e.preventDefault();
        $.post('/files/directory', {
            name: $editModal.find('[name="new-dir-name"]').val(),
            dir: getQueryParameterByName('dir')
        }, function (data) {
            reloadFiles();
        }).fail(showAJAXError);
    });

    $modals.find('.close, .btn-close').on('click', function() {
        $modals.modal('hide');
    });

});