import '../jquery/datetimepicker-easy';

const moment = require('moment');

function toggleConsentEditing() {
	const birthdayInput = document.getElementById('birthday');
	let birthday;
	let age;
	if (birthdayInput) {
		const birthdaytext = birthdayInput.value.split('.');
		birthday = moment(`${birthdaytext[2]}-${birthdaytext[1]}-${birthdaytext[0]}`);
		age = moment().diff(birthday, 'years');
	}

	document.getElementById('consents-overview').querySelectorAll('input').forEach((input) => {
		if (input.getAttribute('disabled') !== undefined) {
			if (age && age >= 18) {
				if ((input.name).match('parent') == null) {
					input.removeAttribute('disabled');
				}
			} else {
				input.removeAttribute('disabled');
			}
		} else {
			input.setAttribute('disabled', 'disabled');
		}
	});
}
window.addEventListener('DOMContentLoaded', () => {
	const target = document.getElementById('edit-consent');
	if (!target) { return; }
	target.addEventListener('click', (event) => {
		toggleConsentEditing();
		event.target.classList.add('hidden');
	});
});


$(document).ready(() => {
	const $pwModal = $('.pw-modal');
	const $deleteModal = $('.delete-modal');
	const $skipregModal = $('.skipreg-modal');

	$('.btn-pw').on('click', (e) => {
		e.preventDefault();
		populateModalForm($pwModal, {
			action: 'pw',
			title: $t('administration.users_edit.headline.changePassword'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.save'),
			fields: undefined,
		});
		$pwModal.appendTo('body').modal('show');
	});

	$('.btn-delete').on('click', (e) => {
		e.preventDefault();
		populateModalForm($deleteModal, {
			action: '',
			title: $t('administration.users_edit.headline.deleteUser'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.delete'),
			fields: {
				displayName: $('input[name="displayName"]').val(),
			},
		});
		$deleteModal.appendTo('body').modal('show');
	});

	$('.btn-skipreg').on('click', (e) => {
		e.preventDefault();
		populateModalForm($skipregModal, {
			action: 'skipregistration',
			title: $t('administration.users_edit.headline.completeRegistration'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.save'),
			fields: undefined,
		});
		$skipregModal.appendTo('body').modal('show');
	});

	function sendLinkEmailClickHandler(e) {
		e.preventDefault();
		const $this = $(this);
		const text = $this.html();
		const $invitationModal = $('.invitation-modal');
		const schoolId = $invitationModal.find("input[name='schoolId']").val();
		let role = 'student';
		if ($this.hasClass('teacher')) {
			role = 'teacher';
		}
		const email = $('input[name="email"]').val();

		$this.html($t('administration.users_edit.button.mailIsBeingSent'));
		$this.attr('disabled', 'disabled');

		$.ajax({
			type: 'POST',
			url:
				`${window.location.origin}/administration/registrationlinkMail`,
			data: {
				role,
				save: true,
				schoolId,
				host: window.location.origin,
				toHash: email,
				patchUser: true,
			},
		})
			.done((data) => {
				if (data.status && data.status === 'ok') {
					$.showNotification(
						$t('administration.users_edit.text.successfullySentMail'),
						'success',
						true,
					);
				} else {
					$.showNotification(
						$t('administration.users_edit.text.errorSendingMail'),
						'danger',
						true,
					);
				}
				$this.attr('disabled', false);
				$this.html(text);
			})
			.fail(() => {
				$.showNotification(
					$t('administration.users_edit.text.errorSendingMail'),
					'danger',
					true,
				);
				$this.attr('disabled', false);
				$this.html(text);
			});
	}
	$('.btn-send-link-email').on('click', sendLinkEmailClickHandler);

	function createInvitationHashHandler(e) {
		e.preventDefault();
		const $invitationModal = $('.invitation-modal');
		const schoolId = $invitationModal.find("input[name='schoolId']").val();
		let role = 'student';
		const email = $('input[name="email"]').val();
		if ($(this).hasClass('teacher')) role = 'teacher';
		$.ajax({
			type: 'POST',
			url: `${window.location.origin}/administration/registrationlink`,
			data: {
				role,
				save: true,
				schoolId,
				host: window.location.origin,
				toHash: email,
				patchUser: true,
			},
			success(linkData) {
				populateModalForm($invitationModal, {
					title: $t('administration.users_edit.headline.generatedLink'),
					closeLabel: $t('global.button.cancel'),
					submitLabel: $t('global.button.save'),
					fields: { invitation: linkData.shortLink },
				});
				$invitationModal.find('.btn-submit').remove();

				function selectThis() {
					$(this).select();
				}
				$invitationModal.find("input[name='invitation']").click(selectThis);

				$invitationModal.appendTo('body').modal('show');
			},
		});
	}
	$('.btn-invitation-link-with-hash').on('click', createInvitationHashHandler);
});
