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
});
