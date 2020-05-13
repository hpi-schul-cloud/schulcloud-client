/* global CKEDITOR */
import multiDownload from 'multi-download';

import { softNavigate } from './helpers/navigation';
import { getQueryParameters } from './helpers/queryStringParameter';

const getDataValue = function(attr) {
    return function() {
        const value = $('.section-upload').data(attr);
		return (value || undefined);
    };
};

const getOwnerId = getDataValue('owner');
const getCurrentParent = getDataValue('parent');

$(document).on('pageload', () => {
    MathJax.Hub.Queue(["Typeset",MathJax.Hub])
});

function archiveTask(e){
    e.preventDefault();
    e.stopPropagation();
    // loading animation
    let btntext = this.innerHTML;
    $(this).find("i").attr("class", "fa fa-spinner fa-spin");
    // send request to server
    let request = $.ajax({
        type: "PATCH",
        url: this.getAttribute("href"),
        data: this.getAttribute("data"),
        context: this,
        error: function(){showAJAXError(); this.innerHTML = btntext;}
    });
    request.done(function(r) {
        // switch text (innerHTML <--> alt-text)
        const temp = $(this).attr("alt-text");
        $(this).attr("alt-text", btntext);
        this.innerHTML = temp;
        // grey out if removed from list
        $(this).parents(".disableable").toggleClass("disabled");
        // change data
        $(this).attr("data",(this.getAttribute("data")=="archive=done")?"archive=open":"archive=done");
    });
    return false;
}
function importSubmission(e){
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
}

window.addEventListener('DOMContentLoaded', () => {
	/* FEATHERS FILTER MODULE */
	const filterModule = document.getElementById('filter');
	if (!filterModule) { return; }
	filterModule.addEventListener('newFilter', (e) => {
		const filter = e.detail;
		const params = getQueryParameters();
		let newurl = `?filterQuery=${escape(JSON.stringify(filter[0]))}`;
		if (params.p) {
			newurl += `&p=${params.p}`;
		}
		softNavigate(newurl, '.homework', '.pagination');
	});
	document.querySelector('.filter').dispatchEvent(new CustomEvent('getFilter'));
});

$(document).ready(() => {
	let fileIsUploaded = false;
	let editorContainsText = false;

	function enableSubmissionWhenFileIsUploaded() {
		const fileList = $('.list-group-files');
		const filesCount = fileList.children().length;
		fileIsUploaded = !!filesCount;
		const submitButton = fileList.closest('form').find('button[type="submit"]')[0];
		if (submitButton) {
			submitButton.disabled = !editorContainsText && !fileIsUploaded;
		}
	}

	// enable submit button when at least one file was uploaded
	enableSubmissionWhenFileIsUploaded();
	$('.list-group-files').bind('DOMSubtreeModified', () => {
		enableSubmissionWhenFileIsUploaded();
	});

	function enableSubmissionWhenEditorContainsText(editor) {
		// find the closest submit button and disable it if no content is given and no file is uploaded
		const submitButton = $(editor.element.$.closest('form')).find('button[type="submit"]')[0];
		const content = editor.document.getBody().getText();
		editorContainsText = !!content.trim();
		if (submitButton) {
			submitButton.disabled = !editorContainsText && !fileIsUploaded;
		}
	}

	// enable submit button when editor contains text
	const editorInstanceNames = Object.keys((window.CKEDITOR || {}).instances || {});
	editorInstanceNames
		.filter(e => e.startsWith('evaluation'))
		.forEach((name) => {
			const editor = window.CKEDITOR.instances[name];
			editor.on('instanceReady', () => { enableSubmissionWhenEditorContainsText(editor); });
			editor.on('change', () => { enableSubmissionWhenEditorContainsText(editor); });
		});

    function showAJAXError(req, textStatus, errorThrown) {
        if (textStatus === "timeout") {
            $.showNotification("Zeitüberschreitung der Anfrage", "danger");
        } else if (errorThrown === "Conflict") {
            $.showNotification("Dieser Dateiname existiert bereits in Ihren Dateien. Bitte benennen Sie die Datei um.", "danger");
        } else {
            $.showNotification(errorThrown, "danger", 15000);
        }
    }

    function ajaxForm(element, after, contentTest){
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
		if (ckeditorInstance) CKEDITOR.instances[ckeditorInstance].updateElement();
		const content = element.serialize();
        if(contentTest){
            if(contentTest(content) == false){
                $.showNotification("Form validation failed", "danger", 15000);
                return;
            }
		}
        let request = $.ajax({
            type: method,
            url: url,
            data: content,
            context: element
		});
        request.done(function(r) {
            var saved = setInterval(_ => {
                submitButton.innerHTML = submitButtonText;
                submitButton.disabled = false;
                submitButton.setAttribute("style",submitButtonStyleDisplay);
                clearInterval(saved);
            }, 2500);
            submitButton.innerHTML = "gespeichert 😊";
            if(after){after(this, element.serializeArray());}
        });
        request.fail(function() {

			showAJAXError(undefined, undefined, 'Die Bewertung konnte leider nicht gespeichert werden.');

            submitButton.disabled = false;
            submitButton.innerHTML = submitButtonText+' <i class="fa fa-close" aria-hidden="true"></i> (error)';
        });
    }
    // Abgabe speichern
    $('form.submissionForm.ajaxForm').on("submit",function(e){
        if(e) e.preventDefault();
        ajaxForm($(this), function(element, content){
            let teamMembers = [];
            content.forEach(e => {
                if(e.name == "teamMembers"){
                    teamMembers.push(e.value);
                }
			});
            if(teamMembers != [] && $(".me").val() && !teamMembers.includes($(".me").val())){
                location.reload();
            }
		});
        return false;
    });

    $('.btn-file-danger').on('click', function(e) {
		e.stopPropagation();
		e.preventDefault();
		const $dangerModal = $('.danger-modal');
		$dangerModal.appendTo('body').modal('show');
    });

    // Abgabe löschen
    $('a[data-method="delete-submission"]').on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var $buttonContext = $(this);
        let $deleteModal = $('.delete-modal');
        $deleteModal.appendTo('body').modal('show');
        $deleteModal.find('.modal-title').text("Bist du dir sicher, dass du '" + $buttonContext.data('name') + "' löschen möchtest?");
        $deleteModal.find('.btn-submit').unbind('click').on('click', function() {
            window.location.href = $buttonContext.attr('href');
        });
    });

    //validate teamMembers
    var lastTeamMembers = null;
    const maxTeamMembers = parseInt($("#maxTeamMembers").html());
    $('#teamMembers').change(function(event) {
        if ($(this).val().length > maxTeamMembers) {
            $(this).val(lastTeamMembers);
            $.showNotification("Die maximale Teamgröße beträgt " + maxTeamMembers + " Mitglieder", "warning", 5000);
        } else {
            lastTeamMembers = $(this).val();
        }
        $(this).chosen().trigger("chosen:updated");
    });

    $('#teamMembers').chosen().change(function(event, data) {
        if(data.deselected && data.deselected == $('.owner').val()){
            $(".owner").prop('selected', true);
            $('#teamMembers').trigger("chosen:updated");
            $.showNotification("Du darfst den Ersteller der Aufgabe nicht entfernen!", "warning", 5000);
        }
    });

    // Bewertung speichern
    $('.evaluation #comment form').on("submit",function(e){
        if(e) e.preventDefault();
        ajaxForm($(this),function(c){
            $.showNotification("Bewertung wurde gespeichert!", "success", 5000);
        },function(c){
            return (c.grade || c.gradeComment);
        });
        return false;
    });

    document.querySelectorAll('.btn-archive').forEach(btn => {btn.addEventListener("click", archiveTask);});

    function updateSearchParameter(key, value) {
        let url = window.location.search;
        let reg = new RegExp('('+key+'=)[^\&]+');
        window.location.search = (url.indexOf(key) !== -1)?(url.replace(reg, '$1' + value)):(url + ((url.indexOf('?') == -1)? "?" : "&") + key + "=" + value);
    }

    document.querySelectorAll('.importsubmission').forEach(btn => {btn.addEventListener("click", importSubmission);});

    // file upload stuff, todo: maybe move or make it more flexible when also uploading to homework-assignment
    let $uploadForm = $(".form-upload");
    let $progressBar = $('.progress-bar');
    let $progress = $progressBar.find('.bar');
    let $percentage = $progressBar.find('.percent');

    let progressBarActive = false;
    let finishedFilesSize = 0;

    /**
     * adds a new file item in the uploaded file section without reload, when no submission exists
     * @param section - the major file list
     * @param file - the new file
     */
    function addNewUploadedFile(section, file) {
        let filesCount = section.children().length === 0 ? -1 : section.children().length;
        let $fileListItem = $(`<li class="list-group-item"><i class="fa fa-file" aria-hidden="true"></i><a href="/files/file?file=${file._id}" target="_blank">${file.name}</a></li>`)
            .append(`<input type="hidden" name="fileIds[${filesCount + 1}]" value="${file._id}" />`);
		section.append($fileListItem);
    }

    $uploadForm.dropzone ? $uploadForm.dropzone({
        accept: function (file, done) {
            // get signed url before processing the file
            // this is called on per-file basis

            $.post('/files/file', {
                parent: getCurrentParent(),
                type: file.type,
                filename: file.name,
            }, function (data) {
                file.signedUrl = data.signedUrl;
                done();
            })
            .fail(showAJAXError);
        },
		createImageThumbnails: false,
		maxFilesize: 1024,
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
                    // delay for error messages
                    setTimeout(function() {
                        // just reload if submission already exists
                        $("input[name='submissionId']").val() ? window.location.reload() : '';
                    }, 1500);
                });
            });

            this.on("success", function (file, response) {
                finishedFilesSize += file.size;

                var parentId = getCurrentParent();
                var params = {
                    name: file.name,
                    owner: getOwnerId(),
                    type: file.type,
                    size: file.size,
                    storageFileName: file.signedUrl.header['x-amz-meta-flat-name'],
                    thumbnail: file.signedUrl.header['x-amz-meta-thumbnail']
                };

                if( parentId ) {
                    params.parent = parentId;
				}

                // post file meta to proxy file service for persisting data
                $.post('/files/fileModel', params , (data) => {
                    // add submitted file reference to submission
                    // hint: this only runs when an submission is already existing. if not, the file submission will be
                    // only saved when hitting the save button in the corresponding submission form
                    let submissionId = $("input[name='submissionId']").val();
                    let homeworkId = $("input[name='homeworkId']").val();

                    let teamMembers = $('#teamMembers').val();
                    if (submissionId) {
                        $.post(`/homework/submit/${submissionId}/files`, {fileId: data._id, teamMembers: teamMembers}, _ => {
                            $.post(`/homework/submit/${submissionId}/files/${data._id}/permissions`, {teamMembers: teamMembers});
                        });
                    } else {
                        addNewUploadedFile($('.js-file-list'), data);

                        // 'empty' submissionId is ok because the route takes the homeworkId first
                        $.post(`/homework/submit/0/files/${data._id}/permissions`, {homeworkId: homeworkId});
					}
                }).fail(showAJAXError);

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

        $deleteModal.appendTo('body').modal('show');
        $deleteModal.find('.modal-title').text("Bist du dir sicher, dass du '" + $buttonContext.data('file-name') + "' löschen möchtest?");

        $deleteModal.find('.btn-submit').unbind('click').on('click', function () {
            $.ajax({
                url: $buttonContext.attr('href'),
                type: 'DELETE',
                data: {
                    key: $buttonContext.data('file-key')
                },
                success: function (_) {
                    // delete reference in submission
                    let submissionId = $("input[name='submissionId']").val();
					let teamMembers = $('#teamMembers').val();
                    $.ajax({
                        url: `/homework/submit/${submissionId}/files`,
                        data: {fileId: fileId, teamMembers: teamMembers},
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

    $('a[data-method="delete-file-homework-edit"]').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        let $buttonContext = $(this);
        let $deleteModal = $('.delete-modal');
        let fileId = $buttonContext.data('file-id');

        $deleteModal.appendTo('body').modal('show');
        $deleteModal.find('.modal-title').text("Bist du dir sicher, dass du '" + $buttonContext.data('file-name') + "' löschen möchtest?");

        $deleteModal.find('.btn-submit').unbind('click').on('click', function () {
            $.ajax({
                url: $buttonContext.attr('href'),
                type: 'DELETE',
                data: {
                    key: $buttonContext.data('file-key')
                },
                success: function () {
                    // delete reference in homework
                    let homeworkId = $("input[name='homeworkId']").val();
					let teamMembers = $('#teamMembers').val();
                    $.ajax({
                        url: `/homework/${homeworkId}/file`,
                        data: {fileId: fileId},
                        type: 'DELETE',
                        success: function () {
                            window.location.reload();
                        }
                    });
                },
                error: showAJAXError
            });
        });
    });

    // typeset all MathJAX formulas displayed
	MathJax.Hub.Typeset()

	// allow muti-download
	$('button.multi-download').on('click', function() {
		const files = $(this).data('files').split(' ');

		// renaming here does not work, because the files are all served from a different origin
		multiDownload(files).then(() => {
			// Clicking a link, even if it is a download link, triggers a `beforeunload` event. Undo those changes here.
			setTimeout(() => document.querySelector('body').classList.add('loaded'), 1000);
		});
	});
});
