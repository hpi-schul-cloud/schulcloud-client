/* eslint-disable no-unused-vars */
import multiDownload from 'multi-download';

import { softNavigate } from './helpers/navigation';
import { getQueryParameters } from './helpers/queryStringParameter';

function getDataValue(attr) {
	return () => {
		const value = $('.section-upload').data(attr);
		return (value || undefined);
	};
}

const getOwnerId = getDataValue('owner');
const getCurrentParent = getDataValue('parent');
let lastFocusedElement;

window.addEventListener('keydown', (e) => {
	if (e.keyCode === 27 && lastFocusedElement) {
		lastFocusedElement.focus();
	}
});

function saveTempData() {
	const submissionId = $('#submissions').find('>.table.table-hover .usersubmission.active').attr('id');
	const submissionRange = $(`#${submissionId}`);
	const grade = { value: submissionRange.find("input[name='grade']").val(), submissionId };
	const gradeComment = { value: submissionRange.find("textarea[name='gradeComment']").val(), submissionId };
	localStorage.setItem('grade', JSON.stringify(grade));
	localStorage.setItem('gradeComment', JSON.stringify(gradeComment));
}

window.onload = function onload() {
	const grade = JSON.parse(localStorage.getItem('grade'));
	const gradeComment = JSON.parse(localStorage.getItem('gradeComment'));
	const submissionId = $('#submissions').find('>.table.table-hover .usersubmission.active').attr('id');
	const submissionRange = $(`#${submissionId}`);
	localStorage.removeItem('grade');
	localStorage.removeItem('gradeComment');

	if (grade && grade.value && grade.submissionId === submissionId) {
		submissionRange.find("input[name='grade']").val(grade.value);
	}

	if (gradeComment && gradeComment.value && gradeComment.submissionId === submissionId) {
		document.querySelector('.usersubmission.active .ck-editor__editable')
			.ckeditorInstance.setData(gradeComment.value);
	}
};

function isSubmissionGradeUpload() {
	// Uses the fact that the page can only ever contain one file upload form,
	// either nested in the submission or the comment tab. And if it is in the
	// comment tab, then it is the submission grade upload
	return $('#comment .section-upload').length > 0;
}

function showAJAXError(req, textStatus, errorThrown) {
	if (textStatus === 'timeout') {
		$.showNotification($t('global.text.requestTimeout'), 'danger');
	} else if (errorThrown === 'Conflict') {
		$.showNotification($t('homework.text.fileAlreadyExists'), 'danger');
	} else {
		$.showNotification(errorThrown, 'danger', 15000);
	}
}

$(document).on('pageload', () => {
	MathJax.Hub.Queue(['Typeset', MathJax.Hub]); // eslint-disable-line no-undef
});

function archiveTask(e) {
	e.preventDefault();
	e.stopPropagation();
	// loading animation
	const btntext = this.innerHTML;
	$(this).find('i').attr('class', 'fa fa-spinner fa-spin');
	// send request to server
	const request = $.ajax({
		type: 'PATCH',
		url: this.getAttribute('href'),
		data: this.getAttribute('data'),
		context: this,
		error() { showAJAXError(); this.innerHTML = btntext; },
	});
	request.done(function action() {
		// switch text (innerHTML <--> alt-text)
		const temp = $(this).attr('alt-text');
		$(this).attr('alt-text', btntext);
		this.innerHTML = temp;
		// grey out if removed from list
		$(this).parents('.disableable').toggleClass('disabled');
		// change data
		$(this).attr('data', (this.getAttribute('data') === 'archive=done') ? 'archive=open' : 'archive=done');
	});
	return false;
}

function importSubmission(e) {
	e.preventDefault();
	const submissionid = this.getAttribute('data');
	this.disabled = true;

	const bounce = '<div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';
	const loadingspinner = '<style>.loadingspinner>div{background-color:#000;}</style><div class="loadingspinner">';
	this.innerHTML = `${$t('homework.button.importing')} ${loadingspinner}${bounce}`;

	// the line with if make no sense ...
	// eslint-disable-next-line no-alert
	if (window.confirm($t('homework.text.doYouReallyWantToReplaceSubmission'))) {
		$.ajax({
			url: `/homework/submit/${submissionid}/import`,
			context: this,
		}).done(function action(r) {
			// CKEDITOR.instances[`evaluation ${submissionid}`].setData(r.comment);
			this.disabled = false;
			this.innerHTML = $t('homework.button.importSubmission');
		});
	}
}

window.addEventListener('DOMContentLoaded', () => {
	/* FEATHERS FILTER MODULE */
	const filterModule = document.getElementById('filter');
	const sortingModal = document.querySelector('.md-chip.md-theme-default');
	const closingButton = document.querySelector('.md-icon-button');
	if (closingButton) {
		closingButton.setAttribute('aria-label', 'Abbrechen');
		closingButton.setAttribute('tabindex', '0');
	}

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
	if (!sortingModal) { return; }
	sortingModal.addEventListener('keydown', (e) => {
		if (e.keyCode === 13 || e.keyCode === 32) {
			lastFocusedElement = sortingModal;
			sortingModal.click();
		}
	});
	document.querySelector('.filter').dispatchEvent(new CustomEvent('getFilter'));
});

$(document).ready(() => {
	$('.submission-button').on('click', (event) => {
		const submitButton = event.currentTarget;
		let submitButtonText = submitButton.innerHTML;
		submitButtonText = submitButtonText.replace(' <i class="fa fa-close" aria-hidden="true"></i> (error)', '');

		const bounces = '<div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';
		const loadingspinner = '<div class="loadingspinner">';
		submitButton.innerHTML = `${submitButtonText}${loadingspinner}${bounces}`;

		submitButton.style.display = 'inline-block';

		$('form.submissionForm.ajaxForm').trigger('submit');
	});

	function ajaxForm(element, after, contentTest) {
		const content = element.serialize();
		if (contentTest) {
			if (contentTest(content) === false) {
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
			if (teamMembers !== [] && $('.me').val() && !teamMembers.includes($('.me').val())) {
				/* unexpected use */
				// eslint-disable-next-line no-restricted-globals
				window.location.reload();
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
	$('a[data-method="delete-submission"]').on('click', function action(e) {
		e.stopPropagation();
		e.preventDefault();
		const $buttonContext = $(this);
		const $deleteModal = $('.delete-modal');
		$deleteModal.appendTo('body').modal('show');
		$deleteModal.find('.modal-title').text(
			$t('global.text.sureAboutDeleting', { name: $buttonContext.data('name') }),
		);
		$deleteModal.find('.btn-submit').unbind('click').on('click', () => {
			window.location.href = $buttonContext.attr('href');
		});
	});

	// validate teamMembers
	let lastTeamMembers = null;
	const maxTeamMembers = parseInt($('#maxTeamMembers').html(), 10);
	$('select#teamMembers').change(function action() {
		if ($(this).val().length > maxTeamMembers) {
			$(this).val(lastTeamMembers);
			$.showNotification($t('homework.text.maximumTeamSize', { maxMembers: maxTeamMembers }), 'warning', 5000);
		} else {
			lastTeamMembers = $(this).val();
		}
		// $(this).chosen().trigger('chosen:updated');
	});

	$('select#teamMembers').change((event, data) => {
		if (data.deselected && data.deselected === $('.owner').val()) {
			$('.owner').prop('selected', true);
			$('#teamMembers').trigger('chosen:updated');
			$.showNotification($t('homework.text.creatorCanNotBeRemoved'), 'warning', 5000);
		}
	});

	// Bewertung speichern
	$('.evaluation #comment form').on('submit', (e) => {
		if (e) e.preventDefault();
		ajaxForm($(e.currentTarget), () => {
			$.showNotification($t('homework.text.ratingHasBeenSaved'), 'success', 5000);
		}, (c) => (c.grade || c.gradeComment));
		return false;
	});

	document.querySelectorAll('.btn-archive').forEach((btn) => { btn.addEventListener('click', archiveTask); });

	document.querySelectorAll('.btn-archive').forEach((btn) => { btn.addEventListener('click', archiveTask); });

	document.querySelectorAll('.importsubmission').forEach(
		(btn) => { btn.addEventListener('click', importSubmission); },
	);

	/**
     * deletes the reference to the submission
     */
	$('a[data-method="delete-file"]').on('click', function actionDeleteFile(e) {
		e.stopPropagation();
		e.preventDefault();
		const $buttonContext = $(this);
		const $deleteModal = $('.delete-modal');
		const fileId = $buttonContext.data('file-id');

		$deleteModal.appendTo('body').modal('show');
		$deleteModal.find('.modal-title').text(
			$t('homework.text.doYouReallyWantToDecoupleFileSubmission', { name: $buttonContext.data('file-name') }),
		);

		$deleteModal.find('.btn-submit').unbind('click').on('click', () => {
			// delete reference in submission
			const submissionId = $("input[name='submissionId']").val();
			const teamMembers = $('#teamMembers').val();
			$.ajax({
				url: `/homework/submit/${submissionId}/files`,
				data: { fileId, teamMembers },
				type: 'DELETE',
				success() {
					saveTempData();
					window.location.reload();
				},
				error: showAJAXError,
			});
		});
	});

	$('a[data-method="delete-file-homework-edit"]').on('click', function actionDeleteFileHomeworkEdit(e) {
		e.stopPropagation();
		e.preventDefault();
		const $buttonContext = $(this);
		const $deleteModal = $('.delete-modal');
		const fileId = $buttonContext.data('file-id');

		$deleteModal.appendTo('body').modal('show');
		$deleteModal.find('.modal-title').text(
			$t('homework.text.doYouReallyWantToDecoupleFileHomework', { name: $buttonContext.data('file-name') }),
		);

		$deleteModal.find('.btn-submit').unbind('click').on('click', () => {
			/*
			// delete the file
			$.ajax({
				url: $buttonContext.attr('href'),
				type: 'DELETE',
				data: {
					id: fileId,
				},
				success() {
			*/
			// delete reference in homework
			const homeworkId = $("input[name='homeworkId']").val();
			$.ajax({
				url: `/homework/${homeworkId}/file`,
				data: { fileId },
				type: 'DELETE',
				success() {
					saveTempData();
					window.location.reload();
				},
				error: showAJAXError,
			});
		});
	});

	// typeset all MathJAX formulas displayed
	MathJax.Hub.Typeset(); // eslint-disable-line no-undef

	// allow muti-download
	$('button.multi-download').on('click', function action() {
		const files = $(this).data('files').split(' ');

		// renaming here does not work, because the files are all served from a different origin
		multiDownload(files).then(() => {
			// Clicking a link, even if it is a download link, triggers a `beforeunload` event. Undo those changes here.
			setTimeout(() => document.querySelector('body').classList.add('loaded'), 1000);
		});
	});

	const $dontShowAgainAlertModal = $('.dontShowAgainAlert-modal');
	function displayModal(headline, content, modal) {
		populateModal(modal, '.modal-title', headline);
		populateModal(modal, '#member-modal-body', content);
		modal.appendTo('body').modal('show');
	}
	function modalCheckboxHandler(headline, content, modal, localStorageItem, checkbox) {
		const isPrivateAlertTrue = localStorage.getItem(localStorageItem)
			? JSON.parse(localStorage.getItem(localStorageItem)) : false;

		if (!isPrivateAlertTrue && $(checkbox).prop('checked')) {
			modal.find('.dontShowAgain-checkbox').prop('checked', false);
			displayModal(headline, content, modal);

			modal.find('.btn-submit').unbind('click').on('click', (e) => {
				e.preventDefault();
				const checkboxValue = modal.find('.dontShowAgain-checkbox').prop('checked');
				localStorage.setItem(localStorageItem, checkboxValue);
				modal.appendTo('body').modal('hide');
			});
		}
	}

	$('#publicSubmissionsCheckbox').on('change', function action(e) {
		e.preventDefault();
		const content = $t('homework.text.activatingThisMakesSubmissionsPublic');
		modalCheckboxHandler(
			$t('global.text.areYouSure'), content, $dontShowAgainAlertModal, 'PublicSubmissions-Alert', this,
		);
	});

	function checkVideoElements() {
		const vids = $('video');
		if (vids.length > 0) {
			$.each(vids, function action() {
				this.controls = true;
			});
		}
	}

	checkVideoElements();
});
