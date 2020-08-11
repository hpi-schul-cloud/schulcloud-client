import multiDownload from 'multi-download';

import { softNavigate } from './helpers/navigation';
import { getQueryParameters } from './helpers/queryStringParameter';
import { requestUploadUrl, createFileModel, associateFilesWithSubmission } from './homework/api-requests';
import extendWithBulkUpload from './homework/bulk-upload';

function getDataValue(attr) {
	return () => {
		const value = $('.section-upload').data(attr);
		return (value || undefined);
	};
}

const getOwnerId = getDataValue('owner');
const getCurrentParent = getDataValue('parent');

function getTeamMemberIds() {
	const domValue = $('#teamMembers').val();
	return $.isArray(domValue) ? domValue : (domValue || '').split(',');
}

function isSubmissionGradeUpload() {
	// Uses the fact that the page can only ever contain one file upload form,
	// either nested in the submission or the comment tab. And if it is in the
	// comment tab, then it is the submission grade upload
	return $('#comment .section-upload').length > 0;
}

$(document).on('pageload', () => {
	MathJax.Hub.Queue(['Typeset', MathJax.Hub]); // eslint-disable-line no-undef
});

function archiveTask(e) {
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
    this.innerHTML = $t('homework.button.importing')+' <style>.loadingspinner>div{background-color:#000;}</style><div class="loadingspinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';
    if(confirm($t('homework.text.doYouReallyWantToReplaceSubmission'))){
        $.ajax({
            url: "/homework/submit/"+submissionid+"/import",
            context: this
        }).done(function(r) {
            CKEDITOR.instances["evaluation "+submissionid].setData( r.comment );
            this.disabled = false;
            this.innerHTML = $t('homework.button.importSubmission');
        });
    }
}

extendWithBulkUpload($);

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
	function enableSubmissionWhenFileIsUploaded() {
		const fileList = $('.list-group-files');
		const filesCount = fileList.children().length;
		const fileIsUploaded = !!filesCount;
		const submitButton = document.querySelector('.ckeditor-submit');
		if (submitButton) {
			submitButton.setAttribute('fileIsUploaded', fileIsUploaded);
			const editorContainsText = submitButton.getAttribute('editorContainsText');
			submitButton.disabled = !editorContainsText && !fileIsUploaded;
		}
	}

	// enable submit button when at least one file was uploaded
	enableSubmissionWhenFileIsUploaded();
	$('.list-group-files').bind('DOMSubtreeModified', () => {
		enableSubmissionWhenFileIsUploaded();
	});

	function showAJAXError(req, textStatus, errorThrown) {
		if (textStatus === 'timeout') {
			$.showNotification($t('global.error.requestTimeout'), 'danger');
		} else if (errorThrown === 'Conflict') {
			$.showNotification($t('homework.text.fileAlreadyExists'), 'danger');
		} else {
			$.showNotification(errorThrown, 'danger', 15000);
		}
	}

    function showAJAXError(req, textStatus, errorThrown) {
        if (textStatus === "timeout") {
            $.showNotification($t('global.text.requestTimeout'), "danger");
        } else if (errorThrown === "Conflict") {
            $.showNotification($t('homework.text.fileAlreadyExists'), "danger");
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
		const content = element.serialize();
		if (contentTest) {
			if (contentTest(content) == false) {
				$.showNotification('Form validation failed', 'danger', 15000);
				return;
			}
		}
		element.unbind('submit');
		element.submit();
	}
	// Abgabe speichern
	$('form.submissionForm.ajaxForm').on('submit', (e) => {
		if (e) e.preventDefault();
		ajaxForm($(e.currentTarget), (element, content) => {
			const teamMembers = [];
			content.forEach((c) => {
				if (c.name === 'teamMembers') {
					teamMembers.push(c.value);
				}
			});
			if(teamMembers != [] && $(".me").val() && !teamMembers.includes($(".me").val())){
				location.reload();
			}
		});
		return false;
	});

	$('.btn-file-danger').on('click', (e) => {
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
        $deleteModal.find('.modal-title').text($t('global.text.sureAboutDeleting', {name : $buttonContext.data('name')}));
        $deleteModal.find('.btn-submit').unbind('click').on('click', function() {
            window.location.href = $buttonContext.attr('href');
        });
    });

    //validate teamMembers
    var lastTeamMembers = null;
    const maxTeamMembers = parseInt($("#maxTeamMembers").html());
    $('select#teamMembers').change(function(event) {
        if ($(this).val().length > maxTeamMembers) {
            $(this).val(lastTeamMembers);
            $.showNotification($t('homework.text.maximumTeamSize', {maxMembers : maxTeamMembers}), "warning", 5000);
        } else {
            lastTeamMembers = $(this).val();
        }
        $(this).chosen().trigger("chosen:updated");
    });

    $('select#teamMembers').chosen().change(function(event, data) {
        if(data.deselected && data.deselected == $('.owner').val()){
            $(".owner").prop('selected', true);
            $('#teamMembers').trigger("chosen:updated");
            $.showNotification(t('homework.text.creatorCanNotBeRemoved'), "warning", 5000);
        }
    });

    // Bewertung speichern
    $('.evaluation #comment form').on("submit",function(e){
        if(e) e.preventDefault();
        ajaxForm($(e.currentTarget),function(c){
            $.showNotification($t('homework.text.ratingHasBeenSaved'), "success", 5000);
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

	document.querySelectorAll('.btn-archive').forEach((btn) => { btn.addEventListener('click', archiveTask); });

	function updateSearchParameter(key, value) {
		const url = window.location.search;
		const reg = new RegExp(`(${key}=)[^&]+`);
		window.location.search = (url.indexOf(key) !== -1)
			? (url.replace(reg, `$1${value}`))
			: (`${url + ((url.indexOf('?') === -1) ? '?' : '&') + key}=${value}`);
	}

	// file upload stuff, todo: maybe move or make it more flexible when also uploading to homework-assignment
	const $uploadForm = $('.form-upload');
	const $progressBar = $('.progress-bar');
	const $progress = $progressBar.find('.bar');
	const $percentage = $progressBar.find('.percent');

	let progressBarActive = false;
	let finishedFilesSize = 0;

	/**
     * adds a new file item in the uploaded file section without reload, when no submission exists
     * @param section - the major file list
     * @param file - the new file
     */
	function addNewUploadedFile(section, file) {
		const filesCount = section.children().length === 0 ? -1 : section.children().length;
		const $fileListItem = $(`<li class="list-group-item">
				<i class="fa fa-file" aria-hidden="true"></i>
				<a href="/files/file?file=${file._id}" target="_blank">${file.name}</a>
			</li>`)
			.append(`<input type="hidden" name="fileIds[${filesCount + 1}]" value="${file._id}" />`);
		section.append($fileListItem);
	}

	$uploadForm.dropzone ? $uploadForm.dropzone({
		accept: function accept(file, done) {
			// get signed url before processing the file
			// this is called on per-file basis
			requestUploadUrl(file, getCurrentParent())
				.then((data) => {
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

				const parentId = getCurrentParent();
				const params = {
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
				createFileModel(params).then((data) => {
					// add submitted file reference to submission
					// hint: this only runs when an submission is already existing. if not, the file submission will be
					// only saved when hitting the save button in the corresponding submission form
					const submissionId = $("input[name='submissionId']").val();
					const homeworkId = $("input[name='homeworkId']").val();

					const teamMembers = getTeamMemberIds();
					if (submissionId) {
						const associationType = isSubmissionGradeUpload() ? 'grade-files' : 'files'
						associateFilesWithSubmission({ submissionId, fileIds: [data._id], associationType, teamMembers });
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
        $deleteModal.find('.modal-title').text($t('global.text.sureAboutDeleting', {name : $buttonContext.data('file-name')}));

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
        $deleteModal.find('.modal-title').text($t('global.text.sureAboutDeleting', {name : $buttonContext.data('file-name')}));

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
	MathJax.Hub.Typeset() // eslint-disable-line no-undef

	// allow muti-download
	$('button.multi-download').on('click', function () {
		const files = $(this).data('files').split(' ');

		// renaming here does not work, because the files are all served from a different origin
		multiDownload(files).then(() => {
			// Clicking a link, even if it is a download link, triggers a `beforeunload` event. Undo those changes here.
			setTimeout(() => document.querySelector('body').classList.add('loaded'), 1000);
		});
	});

	$('.bulk-upload').connectBulkUpload({
		successAlert: '#bulk-grading-success',
		warningAlert: '#bulk-grading-error',
		parent: getCurrentParent(),
		owner: getOwnerId(),
	});

    const $dontShowAgainAlertModal = $('.dontShowAgainAlert-modal');
    function displayModal(headline, content, modal) {
        populateModal(modal, '.modal-title', headline);
        populateModal(modal, '#member-modal-body', content);
        modal.appendTo('body').modal('show');
    }
    function modalCheckboxHandler(headline, content, modal, localStorageItem, checkbox) {
        const isPrivateAlertTrue = localStorage.getItem(localStorageItem) ? JSON.parse(localStorage.getItem(localStorageItem)) : false;
        if (!isPrivateAlertTrue && $(checkbox).prop('checked')) {
            modal.find('.dontShowAgain-checkbox').prop('checked', false);
            displayModal(headline, content, modal);

            modal.find('.btn-submit').unbind('click').on('click', function (e) {
                e.preventDefault();
                const checkboxValue = modal.find('.dontShowAgain-checkbox').prop('checked');
                localStorage.setItem(localStorageItem, checkboxValue);
                modal.appendTo('body').modal('hide');
            });
        }
    }

    $('#publicSubmissionsCheckbox').on('change', function (e) {
        e.preventDefault();
        const content = $t('homework.text.activatingThisMakesSubmissionsPublic');
        modalCheckboxHandler($t('global.text.areYouSure'), content, $dontShowAgainAlertModal, 'PublicSubmissions-Alert', this);
    });

    function checkVideoElements(){
        let vids = $("video");
        if(vids.length>0){
            $.each(vids, function(){
                this.controls = true;
            });
        }
    }

    checkVideoElements();

});
