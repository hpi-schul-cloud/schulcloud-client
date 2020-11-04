import { softNavigate } from './helpers/navigation';
import { populateCourseTimes } from './coursesTimes';
import './jquery/datetimepicker-easy';
import {
	updateQueryStringParameter,
	getQueryParameterByName,
} from './helpers/queryStringParameter';
import printQRs from './helpers/printQRs';

const datetime = require('./datetime/datetime');

/* global populateModalForm */

window.addEventListener('DOMContentLoaded', () => {
	/* FEATHERS FILTER MODULE */
	const filterModule = document.getElementById('filter');
	if (filterModule) {
		filterModule.addEventListener('newFilter', (e) => {
			const filter = e.detail;

			const filterQuery = ` ?filterQuery=${escape(JSON.stringify(filter[0]))}`;

			let page = getQueryParameterByName('p');
			page = page ? `&p=${page}` : '';

			let showTab = getQueryParameterByName('showTab');
			showTab = showTab ? `&showTab=${showTab}` : '';

			softNavigate(`${filterQuery}${page}${showTab}`, '.ajaxcontent', '.pagination');
		});
		document
			.querySelector('.filter')
			.dispatchEvent(new CustomEvent('getFilter'));
	}
});

window.addEventListener('softNavigate', (event) => {
	const { target_url: targetUrl } = event.detail;

	const page = getQueryParameterByName('p', targetUrl);
	updateQueryStringParameter('p', page);

	const showTab = getQueryParameterByName('showTab', targetUrl);
	updateQueryStringParameter('showTab', showTab);
});

$(document).ready(() => {
	const $modals = $('.modal');
	const $terminateSchoolYearModal = $('.terminate-school-year-modal');
	const $addSystemsModal = $('.add-modal');
	const $addRSSModal = $('.add-modal--rss');
	const $addPolicyModal = $('.add-modal--policy');
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
			title: $t('administration.school.headline.finishSchoolYear'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.yes'),
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
			title: $t('global.button.add'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.add'),
		});
		$addSystemsModal.appendTo('body').modal('show');
	});

	$('.btn-add-modal--rss').on('click', (e) => {
		e.preventDefault();
		populateModalForm($addRSSModal, {
			title: $t('global.button.add'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.add'),
		});
		$addRSSModal.appendTo('body').modal('show');
	});

	$('.btn-add-modal--policy').on('click', (e) => {
		e.preventDefault();
		populateModalForm($addPolicyModal, {
			title: $t('administration.school.headline.addPolicy'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.add'),
		});
		$addPolicyModal.appendTo('body').modal('show');
	});

	function handleEditClick(e) {
		e.preventDefault();
		const entry = $(this).attr('href');
		$.getJSON(entry, (result) => {
			result.createdAt = datetime.toDateTimeString(result.createdAt);
			populateModalForm($editModal, {
				action: entry,
				title: $t('global.button.edit'),
				closeLabel: $t('global.button.cancel'),
				submitLabel: $t('global.button.save'),
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
				title: $t('global.headline.delete'),
				closeLabel: $t('global.button.cancel'),
				submitLabel: $t('global.headline.delete'),
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
				title: $t('global.headline.delete'),
				closeLabel: $t('global.button.cancel'),
				submitLabel: $t('global.headline.delete'),
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

		$this.html($t('administration.global.button.mailsAreBeingSent'));
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
					$t('administration.global.text.successfullySentMails'),
					'success',
					true,
				);
				$this.attr('disabled', false);
				$this.html(text);
			})
			.fail(() => {
				$.showNotification(
					$t('administration.global.text.errorSendingMails'),
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

		$this.html($t('administration.global.button.printSheetIsBeingGenerated'));
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
					users.map((user) => ({
						href: user.registrationLink.shortLink,
						title:
							user.fullName
							|| `${user.firstName} ${user.lastName}`,
						description: user.registrationLink.shortLink,
					})),
				);
				$.showNotification(
					$t('administration.global.text.successfullyGeneratedPrintSheet'),
					'success',
					true,
				);
				$this.attr('disabled', false);
				$this.html(text);
			})
			.fail(() => {
				$.showNotification(
					$t('administration.global.text.errorGeneratingPrintSheet'),
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
			'firstName,lastName,email,class,birthday',
			'Max,Mustermann,max@mustermann.de,,',
			'Fritz,Schmidt,fritz.schmidt@schul-cloud.org,1a,',
			'Paula,Meyer,paula.meyer@schul-cloud.org,12/2+12/3,',
			'Hildegard,Handschuh,hildegard@handschuh.de,4b,29.11.1992',
			'Renate,Durchdenwald,renate@durchdenwald.de,,15.02.1994',
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
