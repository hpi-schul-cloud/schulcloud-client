import printQRs from '../../helpers/printQRs';

/* globals populateModalForm */

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
						(item) => `<option value="${item._id}">${item.displayName}</option>`,
					)
					.join('')}`;
			}
		});

	const $importModal = $('.import-modal');

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
	$('.btn-print-links').on('click', btnPrintLinksHandler);
});
