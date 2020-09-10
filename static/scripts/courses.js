import { ERROR_MESSAGES as errorMessagesBBB, STATES as videoconferenceStates } from './videoconference';


/* eslint-disable max-len */
$(document).ready(() => {
	$('.js-course-name-input').change(function courseNameInput() {
		$(this).val($(this).val().trim());
	});

	$('.btn-hidden-toggle').click(function hiddenToggle(e) {
		e.stopPropagation();
		e.preventDefault();
		const $hiddenToggleBtn = $(this);
		const $hiddenToggleIcon = $(this).find('.fa');
		const $card = $(this).closest('.card');
		const href = $(this).attr('href');
		$.ajax({
			method: 'PATCH',
			url: `${href}?json=true`,
			data: { hidden: !$hiddenToggleIcon.hasClass('fa-eye-slash') },
			success(result) {
				if (result.hidden) {
					$hiddenToggleIcon.addClass('fa-eye-slash');
					$hiddenToggleIcon.removeClass('fa-eye');
					$hiddenToggleBtn.attr('title', $t('courses._course.topic.text.revealTopic'));
					$card.addClass('card-transparent');
				} else {
					$hiddenToggleIcon.removeClass('fa-eye-slash');
					$hiddenToggleIcon.addClass('fa-eye');
					$hiddenToggleBtn.attr('title', $t('courses._course.topic.text.hideTopic'));
					$card.removeClass('card-transparent');
				}
			},
		});
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
				});
				$invitationModal.find('.btn-submit').remove();
				$invitationModal.find("input[name='invitation']").click(function inputNameInvitation() {
					$(this).select();
				});

				$invitationModal.appendTo('body').modal('show');
			},
		});
	});


	$('.btn-import-topic').click(function importTopic(e) {
		e.stopPropagation();
		e.preventDefault();
		const courseId = $(this).attr('data-courseId');
		const $importModal = $('.import-modal');
		populateModalForm($importModal, {
			title: $t('courses._course.topic.headline.importTopic'),
			closeLabel: $t('global.button.cancel'),
			submitLabel: $t('global.button.save'),
			fields: { courseId },
		});

		const $modalForm = $importModal.find('.modal-form');
		$modalForm.attr('action', `/courses/${courseId}/importTopic`);
		$importModal.appendTo('body').modal('show');
	});

	$('.move-handle').click((e) => {
		e.stopPropagation();
	});

	if ($('#topic-list').length) {
		$('#topic-list').sortable({
			placeholder: 'ui-state-highlight',
			handle: '.move-handle',
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

	$('.btn-create-share-course').click(function createShareCourse(e) {
		e.stopPropagation();
		e.preventDefault();
		const courseId = $(this).attr('data-courseId');
		const $shareModal = $('.share-modal');
		$.ajax({
			type: 'GET',
			url: `/courses/${courseId}/share/`,
			success(data) {
				populateModalForm($shareModal, {
					title: $t('courses._course.headline.shareCodeGenerated'),
					closeLabel: $t('global.button.close'),
					fields: { shareToken: data.shareToken },
				});
				$shareModal.find('.btn-submit').remove();
				$shareModal.find("input[name='shareToken']").click(function inputNameShareToken() {
					$(this).select();
				});

				$shareModal.appendTo('body').modal('show');

				// eslint-disable-next-line max-len
				$("label[for='shareToken']").text($t('courses._course.text.shareCodeExplanation'));
				// eslint-disable-next-line no-undef
				const image = kjua({
					text: `${$('meta[name=baseUrl]').attr('content')}/courses?import=${data.shareToken}`,
					render: 'image',
				});
				const $shareqrbox = $('.course-qr');
				$shareqrbox.empty();
				// eslint-disable-next-line max-len
				$shareqrbox.append(`<p> ${$t('courses._course.text.QRCodeAlternative')} </p>`);
				$shareqrbox.append(image);
			},
		});
	});

	let activeBbbCard = false;

	const videoconferenceWindowRedirect = (response) => {
		const { url } = response;
		return !url || url.length < 0
			? $.showNotification(errorMessagesBBB.GENERAL_ERROR, 'danger')
			: window.location.replace(url);
	};

	const setVideoConferenceOptions = (options) => {
		const { everyAttendeJoinsMuted, everybodyJoinsAsModerator, moderatorMustApproveJoinRequests } = options;
		const $createVideoconferenceModal = $('.create-videoconference-modal');

		$createVideoconferenceModal.find('[name=startMuted]').bootstrapToggle(everyAttendeJoinsMuted ? 'on' : 'off');
		$createVideoconferenceModal.find('[name=requestModerator]').bootstrapToggle(moderatorMustApproveJoinRequests ? 'on' : 'off');
		$createVideoconferenceModal.find('[name=everyoneIsModerator]').bootstrapToggle(everybodyJoinsAsModerator ? 'on' : 'off');
	};


	if ($('.bbbTool').length > 0) {
		const courseId = $('.bbbTool').parent().attr('data-courseId');

		const videoconferenceResponse = (data) => {
			activeBbbCard = true;
			const { permission, state, options } = data;

			setVideoConferenceOptions(options);


			if (!permission || permission.length < 0) {
				$.showNotification(errorMessagesBBB.NO_PERMISSION, 'danger');
			}

			const guestInactiveState = {
				condition: videoconferenceStates.GuestInactiveState.condition,
				updateUi: () => {
					const reloadIcon = $('.bbbTool-reload-icon');

					$('.bbbTool').off('click').css({
						cursor: 'auto',
						backgroundColor: 'white',
					});

					$('.bbb-state').hide();
					$('.bbb-guest-inactive-state').show();

					reloadIcon.off('click').on('click', (e) => {
						e.stopPropagation();
						e.preventDefault();

						reloadIcon.addClass('reload-animation');

						setTimeout(() => {
							reloadIcon.removeClass('reload-animation');
						}, 700);

						$.ajax({
							type: 'GET',
							url: `/videoconference/course/${courseId}`,
							success: videoconferenceResponse,
						}).done((res) => {
							if (res.state === 'RUNNING') {
								$('.bbb-state').hide();
								$('.bbb-running-videoconference-state').show();
							}
						});
					});
				},
			};

			const modInactiveState = {
				condition: videoconferenceStates.ModeratorInactiveState.condition,
				updateUi: () => {
					$('.bbb-state').hide();
					$('.bbb-moderator-inactive-state').show();
				},
			};

			const runningState = {
				condition: videoconferenceStates.RunningState.condition,
				updateUi: () => {
					$('.bbb-state').hide();
					$('.bbb-running-videoconference-state').show();

					$('.bbbTool').off('click').css({ cursor: 'pointer' }).on('click', () => {
						$.ajax({
							method: 'POST',
							url: '/videoconference/',
							contentType: 'application/json',
							dataType: 'json',
							data: JSON.stringify({
								scopeId: courseId,
								scopeName: 'course',
								options: {},
							}),
						}).done((response) => {
							if (!response.url || response.url.length < 0) {
								$.showNotification(errorMessagesBBB.NOT_STARTED_OR_FINISHED, 'danger');
								$('.bbb-state').hide();
								$('.bbb-guest-inactive-state').show();
							}
							videoconferenceWindowRedirect(response);
						}).fail((error) => {
							if (error && error.status !== 'SUCCESS') {
								$.showNotification(errorMessagesBBB.NOT_STARTED_OR_FINISHED, 'danger');
								$('.bbb-state').hide();
								$('.bbb-guest-inactive-state').show();
							}
						});
					});
				},
			};

			// eslint-disable-next-line func-names
			$('.bbbTool').each(() => {
				[guestInactiveState, modInactiveState, runningState].forEach((bbbState) => {
					if (bbbState.condition(permission, state)) bbbState.updateUi();
				});
			});
		};

		$.ajax({
			type: 'GET',
			url: `/videoconference/course/${courseId}`,
			success: videoconferenceResponse,
			error: (error) => {
				if (error && error.status !== 'SUCCESS') {
					$.showNotification(errorMessagesBBB.GENERAL_ERROR, 'danger');
				}
			},
		});
	}


	// eslint-disable-next-line func-names
	$('.bbbTool').click(function (e) {
		if (!activeBbbCard) {
			return;
		}

		e.stopPropagation();
		e.preventDefault();
		const courseId = $(this).parent().attr('data-courseId');
		const $createVideoconferenceModal = $('.create-videoconference-modal');

		const moderatorCardClickHandler = () => {
			$.ajax({
				type: 'GET',
				url: `/courses/${courseId}/usersJson`,
				success(data) {
					populateModalForm($createVideoconferenceModal, {
						title: $t('courses._course.headline.createVideoconference', { coursename: data.course.name }),
						closeLabel: $t('global.button.cancel'),
						submitLabel: $t('global.button.create'),
					});
				},
			});
			$createVideoconferenceModal.appendTo('body').modal('show');
			$createVideoconferenceModal.off('submit').on('submit', (event) => {
				event.preventDefault();

				const everyAttendeJoinsMuted = $createVideoconferenceModal.find('[name=startMuted]').is(':checked');
				const moderatorMustApproveJoinRequests = $createVideoconferenceModal.find('[name=requestModerator]').is(':checked');
				const everybodyJoinsAsModerator = $createVideoconferenceModal.find('[name=everyoneIsModerator]').is(':checked');

				$.ajax({
					type: 'POST',
					url: '/videoconference/',
					contentType: 'application/json',
					dataType: 'json',
					data: JSON.stringify({
						scopeId: courseId,
						scopeName: 'course',
						options: {
							everyAttendeJoinsMuted,
							moderatorMustApproveJoinRequests,
							everybodyJoinsAsModerator,
						},
					}),
				}).done((response) => {
				// todo, the browser may block popups...
					videoconferenceWindowRedirect(response);
					$('.bbb-state').hide();
					$('.bbb-running-videoconference-state').show();
					$('.bbbTool').off('click').css({ cursor: 'pointer' }).on('click', () => {
						$.ajax({
							type: 'GET',
							url: `/videoconference/course/${courseId}`,
						}).done((res) => {
							if (res.state === 'FINISHED') {
								$('.bbb-state').hide();
								$('.bbb-moderator-inactive-state').show();
								moderatorCardClickHandler();
							} else if (res.state === 'RUNNING') {
								videoconferenceWindowRedirect(response);
							}
						});
					});
				}).fail((error) => {
					if (error && error.status !== 'SUCCESS') {
						return $.showNotification(errorMessagesBBB.GENERAL_ERROR, 'danger');
					}
					return $.showNotification(errorMessagesBBB.GENERAL_ERROR, 'danger');
				});
				$createVideoconferenceModal.modal('hide');
			});
		};
		moderatorCardClickHandler();
	});

	$('.bbbTool-info-icon').click((e) => {
		e.stopPropagation();
		e.preventDefault();

		const $bbbReloadInfoModal = $('.reload-info-modal');

		populateModalForm($bbbReloadInfoModal, {
			title: '',
			closeLabel: 'OK',
		});

		$bbbReloadInfoModal.appendTo('body').modal('show');
	});

	function setCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;SameSite=Lax";
	}
	setCookie('username', 'Peter', 365);
});
