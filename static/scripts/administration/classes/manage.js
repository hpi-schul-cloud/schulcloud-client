window.addEventListener('load', () => {
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
