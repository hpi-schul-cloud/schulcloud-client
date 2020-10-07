import printQRs from '../../helpers/printQRs';

/* globals populateModalForm */

function sortOptions(selector, sortFunction) {
	const input = document.querySelector(selector);
	const options = Array.from(input.querySelectorAll('option'));

	options.sort(sortFunction);
	options.forEach((option) => {
		input.appendChild(option);
	});
}

function sortStudents() {
	const sortFunction = (a, b) => {
		const aValue = a.dataset.lastName;
		const bValue = b.dataset.lastName;
		if (aValue < bValue) {
			return -1;
		}
		if (aValue > bValue) {
			return 1;
		}
		return 0;
	};

	const studentInputSelector = 'select[name=userIds]';
	sortOptions(studentInputSelector, sortFunction);
}

function copy(event) {
	event.preventDefault();
	const { copySelector } = event.target.dataset;
	const copySource = document.querySelector(copySelector);
	copySource.select();
	document.execCommand('copy');
	$.showNotification(
		$t('administration.classes.text.linkCopiedToClipboard'),
		'success',
		3000,
	);
}
function initializeCopy() {
	document.querySelectorAll('.copy').forEach((btn) => {
		btn.addEventListener('click', copy);
	});
}

function printInvitation(event) {
	event.preventDefault();
	const className = document.querySelector('input[name=class-name]').value;
	const invitationLink = document.querySelector('#invitationLink').value;
	const invitation = {
		href: invitationLink,
		title: `${$t('administration.classes.label.class')} ${className}`,
		description: invitationLink,
	};
	const invitations = Array(25).fill(invitation);
	printQRs(invitations);
}


window.addEventListener('DOMContentLoaded', () => {
	initializeCopy();
	document
		.querySelector('#printInvitation')
		.addEventListener('click', printInvitation);
});

window.addEventListener('load', () => {
	document
		.getElementById('filter_schoolyear')
		.addEventListener('input', async (event) => {
			// get filtered classes
			const yearId = event.target.value;
			const res = await fetch(
				`/administration/classes/json?yearId=${yearId}`,
				{ credentials: 'same-origin' },
			);
			const classes = await res.json();
			const classInput = document.getElementById(
				'student_from_class_import',
			);

			// update items
			if (classes.total === 0) {
				classInput.innerHTML = `<option value="" disabled>
					${$t('administration.classes.text.noClassesInYear')}
				</option>`;
			} else {
				classInput.innerHTML = `${classes.data
					.map(
						item => `<option value="${item._id}">${item.displayName}</option>`,
					)
					.join('')}`;
			}
		});

	const $importModal = $('.import-modal');

	$('.btn-import-class').on('click', (event) => {
		event.preventDefault();
		document
			.querySelectorAll('select[name="classes"] option')
			.forEach((option) => {
				option.selected = false;
			});
		populateModalForm($importModal, {
			title: $t('administration.classes.headline.importClass'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.add'),
		});
		$importModal.appendTo('body').modal('show');
	});

	$importModal.find('.btn-submit').on('click', async (event) => {
		event.preventDefault();
		const selections = $('#student_from_class_import')
			.val();
		const requestUrl = `/administration/classes/students?classes=${encodeURI(
			JSON.stringify(selections),
		)}`;
		$importModal.modal('hide');
		const res = await fetch(requestUrl, {
			credentials: 'same-origin',
		});
		const students = await res.json();
		students.forEach((student) => {
			document.querySelector(
				`option[value="${student._id}"]`,
			).selected = true;
		});
		sortStudents();
	});

	function btnSendLinksEmailsHandler(e) {
		e.preventDefault();
		const $this = $(this);
		const text = $this.html();
		const classId = $this.data('class');
		const role = $this.data('role');

		$this.html($t('administration.global.button.mailsAreBeingSent'));
		$this.attr('disabled', 'disabled');

		$.ajax({
			type: 'GET',
			url: `${window.location.origin}/administration/users-without-consent/send-email`,
			data: {
				classId,
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

	$('.btn-send-links-emails').on('click', btnSendLinksEmailsHandler);

	function btnPrintLinksHandler(e) {
		e.preventDefault();
		const $this = $(this);
		const text = $this.html();
		const classId = $this.data('class');
		const role = $this.data('role');

		$this.html($t('administration.global.button.printSheetIsBeingGenerated'));
		$this.attr('disabled', 'disabled');

		$.ajax({
			type: 'GET',
			url: `${window.location.origin}/administration/users-without-consent/get-json`,
			data: {
				classId,
				role,
			},
		})
			.done((users) => {
				printQRs(
					users.map(user => ({
						href: user.registrationLink.shortLink,
						title: user.fullName,
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
	$('.btn-print-links').on('click', btnPrintLinksHandler);
});

window.addEventListener('load', sortStudents);
