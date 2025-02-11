import moment from 'moment-timezone';
import { dateStringToMoment } from './datetime/datetime';

/* eslint-disable max-len */
$(document).ready(() => {
	// Safari 3.0+ "[object HTMLElementConstructor]"
	const remoteNotification = (p) => (p.toString() === '[object SafariRemoteNotification]');
	const isSafari = /constructor/i.test(window.HTMLElement)
	|| remoteNotification(!window.safari || (typeof safari !== 'undefined' && safari.pushNotification));
	if (isSafari) {
		$('.safari-workaround').show();
	}

	$('.btn-hidden-toggle').click(function hiddenToggle(e) {
		e.stopPropagation();
		e.preventDefault();
		const $hiddenToggleBtn = $(this);
		const $hiddenToggleIcon = $(this).find('.fa');
		const $card = $(this).closest('.card');
		const href = $(this).attr('href');
		if (!$hiddenToggleIcon.hasClass('fa-spinner')) {
			const hiddenValue = !$hiddenToggleIcon.hasClass('fa-eye-slash');

			$hiddenToggleIcon.removeClass('fa-eye');
			$hiddenToggleIcon.removeClass('fa-eye-slash');
			$hiddenToggleIcon.addClass('fa-spinner fa-spin');
			$.ajax({
				method: 'PATCH',
				url: `${href}?json=true`,
				data: { hidden: hiddenValue },
				success(result) {
					if (result.hidden) {
						$hiddenToggleIcon.removeClass('fa-spinner fa-spin');
						$hiddenToggleIcon.addClass('fa-eye-slash');
						$hiddenToggleBtn.attr('title', $t('courses._course.topic.text.revealTopic'));
						$card.addClass('card-transparent');
					} else {
						$hiddenToggleIcon.removeClass('fa-spinner fa-spin load-icon spinner');
						$hiddenToggleIcon.addClass('fa-eye');
						$hiddenToggleBtn.attr('title', $t('courses._course.topic.text.hideTopic'));
						$card.removeClass('card-transparent');
					}
				},
				error(error) {
					if (error && error.status !== 'SUCCESS') {
						$.showNotification(error.responseText, 'danger');
					}
					if (hiddenValue) {
						$hiddenToggleIcon.removeClass(
							'fa-spinner fa-spin load-icon spinner',
						);
						$hiddenToggleIcon.addClass('fa-eye');
						$hiddenToggleBtn.attr(
							'title',
							$t('courses._course.topic.text.hideTopic'),
						);
						$card.removeClass('card-transparent');
					} else {
						$hiddenToggleIcon.removeClass('fa-spinner fa-spin');
						$hiddenToggleIcon.addClass('fa-eye-slash');
						$hiddenToggleBtn.attr(
							'title',
							$t('courses._course.topic.text.revealTopic'),
						);
						$card.addClass('card-transparent');
					}
				},
			});
		}
	});

	$('.btn-create-invitation').click(function createInvitation(e) {
		e.stopPropagation();
		e.preventDefault();
		const target = `${$(this).attr('data-href')}addStudent`;
		const $invitationModal = $('.invitation-modal');
		$.ajax({
			type: 'POST',
			url: '/link/',
			beforeSend(xhr) {
				// eslint-disable-next-line no-undef
				xhr.setRequestHeader('Csrf-Token', csrftoken);
			},
			data: {
				target,
			},
			success(data) {
				populateModalForm($invitationModal, {
					title: $t('global.headline.invitationLinkGenerated'),
					closeLabel: $t('global.button.cancel'),
					submitLabel: $t('global.button.save'),
					fields: { invitation: data.newUrl },
					submitDataTestId: 'invitation-modal',
				});
				$invitationModal.find('.btn-submit').remove();
				$invitationModal.find('input[name="invitation"]').click(function inputNameInvitation() {
					$(this).select();
				});

				$invitationModal.appendTo('body').modal('show');
			},
		});
	});

	$('.move-handle').click((e) => {
		e.stopPropagation();
	});

	if ($('#topic-list').length) {
		$('#topic-list').sortable({
			placeholder: 'ui-state-highlight',
			handle: '.move-handle',
			cancel: '',
			update() {
				const positions = {};
				$('#topic-list .card-topic').each(function topicListCardTopic(i) {
					positions[($(this).attr('data-topicId'))] = i;
				});
				const courseId = $(this).attr('data-courseId');
				$.ajax({
					type: 'PATCH',
					url: `/courses/${courseId}/positions`,
					data: positions,
				});
			},
		});

		$('#topic-list').disableSelection();
	}

	const isFirstDateSameOrBeforeLastDate = () => {
		const firstDate = dateStringToMoment($('#startDate').val());
		const lastDate = dateStringToMoment($('#untilDate').val());

		return moment(firstDate).isSameOrBefore(lastDate);
	};

	const setValidity = (element, errorMessageElement, showError = true) => {
		if (showError) {
			element.setCustomValidity('The input is required');
			if (errorMessageElement) {
				$(errorMessageElement).css('visibility', 'visible');
			}
		} else {
			element.setCustomValidity('');
			if (errorMessageElement) {
				$(errorMessageElement).css('visibility', 'hidden');
			}
		}
	};

	$('#nextSection').on('click', (e) => {
		e.stopPropagation();

		const selectedOptionsArray = $('#courseTeacher').val();
		const startDateElement = $('#startDate');
		const input = $('.chosen-search-input')[0];

		setValidity(startDateElement[0], '#invalidTimeError', !isFirstDateSameOrBeforeLastDate());

		if (selectedOptionsArray.length < 1) {
			setValidity(input, '#courseTeacherErr', true);
			$('.chosen-search-input').css('box-shadow', 'none');
			$('#courseTeacher_chosen').addClass('validateError');
		} else {
			setValidity(input, '#courseTeacherErr', false);
			$('#courseTeacher_chosen').css('box-shadow', 'none');
		}
	});

	$('#courseTeacher').on('change', () => {
		const selectedOptionsArray = $('#courseTeacher').val();
		const input = $('.chosen-search-input')[0];

		if (selectedOptionsArray.length < 1) {
			setValidity(input, '#courseTeacherErr', true);
			$('.chosen-search-input').css('box-shadow', 'none');
			$('#courseTeacher_chosen').css('box-shadow', '0 0 5px 1px #ff1134');
		} else {
			setValidity(input, '#courseTeacherErr', false);
			$('#courseTeacher_chosen').css('box-shadow', 'none');
		}
	});

	$('#teacherId').on('change', () => {
		const selectedOptionsArray = $('#teacherId').val();
		const input = $('.chosen-search-input')[0];

		if (selectedOptionsArray.length < 1) {
			setValidity(input, '#courseTeacherErr', true);
			$('.chosen-search-input').css('box-shadow', 'none');
			$('#teacherId_chosen').css('box-shadow', '0 0 5px 1px #ff1134');
		} else {
			setValidity(input, '#courseTeacherErr', false);
			$('#teacherId_chosen').css('box-shadow', 'none');
		}
	});

	$('#startDate, #untilDate').on('change', () => {
		setValidity($('#startDate')[0], '#invalidTimeError', !isFirstDateSameOrBeforeLastDate());
	});

	$(document).on('change', '.lengthOfLesson', (e) => {
		const inputElement = $(`[name="${e.target.name}"]`)[0];
		const errElement = `[name="${e.target.name}[err]"]`;
		setValidity(inputElement, errElement, (e.target.value < 0));
	});
});
