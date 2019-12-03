import { softNavigate } from './helpers/navigation';
import { populateCourseTimes } from './coursesTimes';
import './jquery/datetimepicker-easy';
import {
	updateQueryStringParameter,
	getQueryParameterByName,
} from './helpers/queryStringParameter';
import printQRs from './helpers/printQRs';

/* global populateModalForm */

window.addEventListener('DOMContentLoaded', () => {
	/* FEATHERS FILTER MODULE */
	const filterModule = document.getElementById('filter');
	if (filterModule) {
		filterModule.addEventListener('newFilter', (e) => {
			const filter = e.detail;
			const newurl = `?filterQuery=${
				escape(JSON.stringify(filter[0]))
			}&p=${
				getQueryParameterByName('p')}`;
			softNavigate(newurl, '.ajaxcontent', '.pagination');
		});
		document
			.querySelector('.filter')
			.dispatchEvent(new CustomEvent('getFilter'));
	}
});

window.addEventListener('softNavigate', (event) => {
	const { target_url: targetUrl } = event.detail;
	const param = getQueryParameterByName('p', targetUrl);
	updateQueryStringParameter('p', param);
});

$(document).ready(() => {
	const $modals = $('.modal');
	const $terminateSchoolYearModal = $('.terminate-school-year-modal');
	const $addSystemsModal = $('.add-modal');
	const $addRSSModal = $('.add-modal--rss');
	const $editModal = $('.edit-modal');
	const $invitationModal = $('.invitation-modal');
	const $importModal = $('.import-modal');
	const $deleteSystemsModal = $('.delete-modal');
	const $deleteRSSModal = $('.delete-modal--rss');

	$('.ldapschoolyearadditionalinfotoggle').on('click', (e) => {
		e.preventDefault();
		$('#ldapschoolyearadditionalinfo').toggle();
	});

	$('.btn-terminate-school-year').on('click', (e) => {
		e.preventDefault();
		populateModalForm($terminateSchoolYearModal, {
			title: 'Das Schuljahr wirklich beenden?',
			closeLabel: 'Abbrechen',
			submitLabel: 'Ja',
		});
		$terminateSchoolYearModal.appendTo('body').modal('show');
	});

	$('#checkldapdata').on('click', (e) => {
		e.preventDefault();
		document.querySelector('#startldapschoolyear').disabled = false;
		window.open('/administration/startldapschoolyear');
	});

	const startschoolyearbutton = document.querySelector(
		'#startldapschoolyear',
	);
	if (startschoolyearbutton) {
		startschoolyearbutton.addEventListener('change', (status) => {
			if (status.currentTarget.checked) {
				document.querySelector(
					'#buttonstartldapschoolyear',
				).disabled = false;
				document
					.querySelector('#checkldapdata')
					.classList.add('disabled');
				document
					.querySelector('#section-2')
					.classList.remove('current');
				document.querySelector('#section-2').classList.add('done');
				document.querySelector('#section-2').innerHTML = '&#x2713;';
				document.querySelector('#section-3').classList.add('current');
			} else {
				document.querySelector(
					'#buttonstartldapschoolyear',
				).disabled = true;
				document
					.querySelector('#checkldapdata')
					.classList.remove('disabled');
				document.querySelector('#section-2').classList.remove('done');
				document.querySelector('#section-2').classList.add('current');
				document.querySelector('#section-2').innerHTML = '2';
				document
					.querySelector('#section-3')
					.classList.remove('current');
			}
		});
	}

	$('.btn-add-modal').on('click', (e) => {
		e.preventDefault();
		populateModalForm($addSystemsModal, {
			title: 'Hinzufügen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Hinzufügen',
		});
		$addSystemsModal.appendTo('body').modal('show');
	});

	$('.btn-add-modal--rss').on('click', (e) => {
		e.preventDefault();
		populateModalForm($addRSSModal, {
			title: 'Hinzufügen',
			closeLabel: 'Abbrechen',
			submitLabel: 'Hinzufügen',
		});
		$addRSSModal.appendTo('body').modal('show');
	});

	function handleEditClick(e) {
		e.preventDefault();
		const entry = $(this).attr('href');
		$.getJSON(entry, (result) => {
			result.createdAt = new Date(result.createdAt).toLocaleString();
			populateModalForm($editModal, {
				action: entry,
				title: 'Bearbeiten',
				closeLabel: 'Abbrechen',
				submitLabel: 'Speichern',
				fields: result,
			});
			// post-fill gradiation selection
			if ($editModal.find('input[name=gradeSystem]').length) {
				const $gradeInputPoints = $editModal.find('#gradeSystem0');
				const $gradeInputMarks = $editModal.find('#gradeSystem1');
				if (result.gradeSystem) {
					$gradeInputMarks.attr('checked', true);
					$gradeInputPoints.removeAttr('checked');
				} else {
					$gradeInputPoints.attr('checked', true);
					$gradeInputMarks.removeAttr('checked');
				}
			}
			populateCourseTimes($editModal, result.times || []);
			$editModal.appendTo('body').modal('show');
		});
	}
	$('.btn-edit').on('click', handleEditClick);

	function invitationLinkHandler(e) {
		e.preventDefault();
		const schoolId = $invitationModal.find("input[name='schoolId']").val();
		let role = 'student';
		if ($(this).hasClass('teacher')) role = 'teacher';
		$.ajax({
			type: 'POST',
			url: `${window.location.origin}/administration/registrationlink`,
			data: {
				role,
				save: true,
				schoolId,
				host: window.location.origin,
			},
			success(linkData) {
				populateModalForm($invitationModal, {
					title: 'Einladungslink generiert!',
					closeLabel: 'Abbrechen',
					submitLabel: 'Speichern',
					fields: { invitation: linkData.shortLink },
				});
				$invitationModal.find('.btn-submit').remove();
				$invitationModal
					.find("input[name='invitation']")
					// eslint-disable-next-line func-names
					.click(function () {
						$(this).select();
					});

				$invitationModal.appendTo('body').modal('show');
			},
		});
	}
	$('.btn-invitation-link').on('click', invitationLinkHandler);

	$('.btn-import').on('click', (e) => {
		e.preventDefault();
		populateModalForm($importModal, {
			title: 'Nutzer Importieren',
			closeLabel: 'Abbrechen',
			submitLabel: 'Importieren',
			fields: {
				sendRegistration: 'true',
			},
		});
		$importModal.appendTo('body').modal('show');
	});

	function ssoSelectHandler(e) {
		e.preventDefault();
		// show oauth properties for iserv only
		// TODO: later we need a extra field, if we have some more oauth providers
		const selectedType = $(this)
			.find('option:selected')
			.val();
		$('.collapsePanel').css('display', selectedType === 'iserv' ? 'block' : 'none');
	}
	$('.sso-type-selection').on('change', ssoSelectHandler);

	function handleBsModal() {
		// when edit modal is opened, show oauth properties for iserv
		const selectedType = $(this)
			.find('.sso-type-selection')
			.find('option:selected')
			.val();
		if (selectedType === 'iserv') {
			$(this)
				.find('.collapsePanel')
				.css('display', 'block');
		}
	}
	$('.edit-modal').on('shown.bs.modal', handleBsModal);

	$modals.find('.close, .btn-close').on('click', () => {
		$modals.modal('hide');
	});

	function handleBtnClick(e) {
		e.preventDefault();
		const entry = $(this)
			.parent()
			.attr('action');
		$.getJSON(entry, (result) => {
			populateModalForm($deleteSystemsModal, {
				action: entry,
				title: 'Löschen',
				closeLabel: 'Abbrechen',
				submitLabel: 'Löschen',
				fields: result,
			});

			$deleteSystemsModal.appendTo('body').modal('show');
		});
	}
	$('.btn-delete').on('click', handleBtnClick);

	function handleDeleteRss(e) {
		e.preventDefault();
		const action = $(this)
			.parent()
			.attr('action');
		$.getJSON(action, (result) => {
			populateModalForm($deleteRSSModal, {
				action,
				fields: { url: result.url },
				title: 'Löschen',
				closeLabel: 'Abbrechen',
				submitLabel: 'Löschen',
			});

			$deleteRSSModal.modal('show');
		});
	}
	$('.btn-delete--rss').on('click', handleDeleteRss);

	function handleSendLinkEmailsClick(e) {
		e.preventDefault();
		const $this = $(this);
		const text = $this.html();
		const role = $this.data('role');

		$this.html('E-Mails werden gesendet...');
		$this.attr('disabled', 'disabled');

		$.ajax({
			type: 'GET',
			url:
				`${window.location.origin
				}/administration/users-without-consent/send-email`,
			data: {
				role,
			},
		})
			.done(() => {
				$.showNotification(
					'Erinnerungs-E-Mails erfolgreich versendet',
					'success',
					true,
				);
				$this.attr('disabled', false);
				$this.html(text);
			})
			.fail(() => {
				$.showNotification(
					'Fehler beim senden der Erinnerungs-E-Mails',
					'danger',
					true,
				);
				$this.attr('disabled', false);
				$this.html(text);
			});
	}

	function handlePrintLinksClick(e) {
		e.preventDefault();
		const $this = $(this);
		const text = $this.html();
		const role = $this.data('role');

		$this.html('Druckbogen wird generiert...');
		$this.attr('disabled', 'disabled');

		$.ajax({
			type: 'GET',
			url:
				`${window.location.origin
				}/administration/users-without-consent/get-json`,
			data: {
				role,
			},
		})
			.done((users) => {
				printQRs(
					users.map(user => ({
						href: user.registrationLink.shortLink,
						title:
							user.fullName
							|| `${user.firstName} ${user.lastName}`,
						description: user.registrationLink.shortLink,
					})),
				);
				$.showNotification(
					'Druckbogen erfolgreich generiert',
					'success',
					true,
				);
				$this.attr('disabled', false);
				$this.html(text);
			})
			.fail(() => {
				$.showNotification(
					'Problem beim Erstellen des Druckbogens',
					'danger',
					true,
				);
				$this.attr('disabled', false);
				$this.html(text);
			});
	}

	$('.btn-send-links-emails').off('click').on('click', handleSendLinkEmailsClick);

	$('.btn-print-links').off('click').on('click', handlePrintLinksClick);

	$('#csv-import-example').off('click').on('click', (e) => {
		e.preventDefault();
		const lines = [
			'firstName,lastName,email,class',
			'Max,Mustermann,max@mustermann.de,',
			'Fritz,Schmidt,fritz.schmidt@schul-cloud.org,1a',
			'Paula,Meyer,paula.meyer@schul-cloud.org,12/2+12/3',
		];
		const csvContent = `data:text/csv;charset=utf-8,${lines.join('\n')}`;
		const link = document.createElement('a');
		link.setAttribute('href', encodeURI(csvContent));
		link.setAttribute('download', 'beispiel.csv');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});
});
