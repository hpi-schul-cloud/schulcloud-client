function getCurrentDir() {
    return $('.section-upload').data('path');
}
$(document).ready(function() {

    function showAJAXError(req, textStatus, errorThrown) {
        if(textStatus==="timeout") {
            $.showNotification("Zeitüberschreitung der Anfrage", "warn");
        } else {
            $.showNotification(errorThrown, "danger");
        }
    }

    function ajaxForm(element, after){
        const submitButton = element.find('[type=submit]')[0];
        let submitButtonText = submitButton.innerHTML || submitButton.value;
        submitButtonText = submitButtonText.replace(' <i class="fa fa-close" aria-hidden="true"></i> (error)',"");
        submitButton.innerHTML = submitButtonText+' <div class="loadingspinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';
        submitButton.disabled = true;
        const submitButtonStyleDisplay = submitButton.getAttribute("style");
        submitButton.style["display"]="inline-block";

        const url     = element.attr("action");
        const method  = element.attr("method");
        // update value of ckeditor instances
        let ckeditorInstance = element.find('textarea.customckeditor').attr("id");
        if(ckeditorInstance) CKEDITOR.instances[ckeditorInstance].updateElement(); 
        const content = element.serialize();
        let request = $.ajax({
            type: method,
            url: url,
            data: content,
            context: element
        });
        request.done(function(r) {
            submitButton.innerHTML = submitButtonText;
            submitButton.disabled = false;
            submitButton.setAttribute("style",submitButtonStyleDisplay);
            if(after) after(this);
        });
        request.fail(function(r) {
            submitButton.disabled = false;
            submitButton.innerHTML = submitButtonText+' <i class="fa fa-close" aria-hidden="true"></i> (error)';
        });
    }

    // Bewertung speichern
    $('.evaluation #comment form').on("submit",function(e){
        if(e) e.preventDefault();
        ajaxForm($(this));
        return false;
    });

    // Kommentar erstellen
    $('.discussionarea form[action="/homework/comment"]').on("submit",function(e){
        if(e) e.preventDefault();
        ajaxForm($(this),function(t){
            $(t).parent().prev().append('<li class="comment"><b class="name">'+$(t).find("div[data-username]").attr('data-username')+'</b><pre>'+$(t).find("textarea")[0].value+'</pre></li>');
            $(t).find("textarea")[0].value = "";
        });
        return false;
    });

    // Kommentar löschen
    $('.discussionarea ul.comments form').on("submit",function(e){
        if(e) e.preventDefault();
        if(confirm("Kommentar endgültig löschen?")){
            ajaxForm($(this),function(t){
                $(t).closest("li.comment").remove();
            });
        }
        return false;
    });

    function updateSearchParameter(key, value) {
        let url = window.location.search;
        let reg = new RegExp('('+key+'=)[^\&]+');
        window.location.search = (url.indexOf(key) !== -1)?(url.replace(reg, '$1' + value)):(url + ((url.indexOf('?') == -1)? "?" : "&") + key + "=" + value);
    }

    $('#desc').on('click', function(){
        updateSearchParameter("desc", escape($('#desc').val()));
    });
    $('#sortselection').on('change',  function(){
        updateSearchParameter("sort", escape($('#sortselection').val()));
    });

    $('.importsubmission').on('click', function(e){
        e.preventDefault();
        const submissionid = this.getAttribute("data");
        this.disabled = true;
        this.innerHTML = 'importiere <style>.loadingspinner>div{background-color:#000;}</style><div class="loadingspinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';
        if(confirm("Möchten Sie wirklich Ihre Bewertung durch die Abgabe des Schülers ersetzen?")){
            $.ajax({
                url: "/homework/submit/"+submissionid+"/import",
                context: this
            }).done(function(r) {
                CKEDITOR.instances["evaluation "+submissionid].setData( r.comment );
                this.disabled = false;
                this.innerHTML = "Abgabe des Schülers importieren";
            });
        }
    });

    // file upload stuff
    let $uploadForm = $(".form-upload");
    let $progressBar = $('.progress-bar');
    let $progress = $progressBar.find('.bar');
    let $percentage = $progressBar.find('.percent');

    let progressBarActive = false;
    let finishedFilesSize = 0;
    $uploadForm.dropzone ? $uploadForm.dropzone({
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

                    $uploadForm.fadeOut(50, function () {
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
                    $uploadForm.fadeIn(50);
                    // todo: show uploaded file in submission
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
                }, (data) => {
                    // add submitted file reference to submission
                    // hint: this only runs when an submission is already existing. if not, the file submission will be
                    // only saved when hitting the the save button in the corresponding submission form

                    let submissionId = $("input[name='submissionId']").val();
                    if (submissionId) {
                       $.post(`/homework/submit/${submissionId}/file`, {fileId: data._id});
                    }
                });

                this.removeFile(file);

            });

            this.on("dragover", function (file, response) {
                $uploadForm.addClass('focus');
            });

            this.on("dragleave", function () {
                $uploadForm.removeClass('focus');
            });

            this.on("dragend", function (file, response) {
                $uploadForm.removeClass('focus');
            });

            this.on("drop", function (file, response) {
                $uploadForm.removeClass('focus');
            });
        }
    }) : '';

    /**
     * deletes a) the file itself, b) the reference to the submission
     */
    $('a[data-method="delete-file"]').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        let $buttonContext = $(this);
        let $deleteModal = $('.delete-modal');
        let fileId = $buttonContext.data('file-id');

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
                success: function (_) {
                    // delete reference in submission
                    let submissionId = $("input[name='submissionId']").val();
                    $.ajax({
                        url: `/homework/submit/${submissionId}/file`,
                        data: {fileId: fileId},
                        type: 'DELETE',
                        success: function (_) {
                            window.location.reload();
                        }
                    });
                },
                error: showAJAXError
            });
        });
    });
});