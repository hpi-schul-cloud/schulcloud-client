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
					$hiddenToggleBtn.attr('data-original-title', 'Thema sichtbar machen');
					$card.addClass('card-transparent');
				} else {
					$hiddenToggleIcon.removeClass('fa-eye-slash');
					$hiddenToggleIcon.addClass('fa-eye');
					$hiddenToggleBtn.attr('data-original-title', 'Thema verstecken');
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
					title: 'Einladungslink generiert!',
					closeLabel: 'Abbrechen',
					submitLabel: 'Speichern',
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
			title: 'Thema importieren',
			closeLabel: 'Abbrechen',
			submitLabel: 'Speichern',
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
					title: 'Kopiercode generiert!',
					closeLabel: 'Schließen',
					fields: { shareToken: data.shareToken },
				});
				$shareModal.find('.btn-submit').remove();
				$shareModal.find("input[name='shareToken']").click(function inputNameShareToken() {
					$(this).select();
				});

				$shareModal.appendTo('body').modal('show');

				// eslint-disable-next-line max-len
				$("label[for='shareToken']").text('Verteile folgenden Code an einen Lehrer-Kollegen, um den Kurs mit diesem zu teilen. Die Funktion befindet sich auf der Übersichtsseite für Kurse.');
				// eslint-disable-next-line no-undef
				const image = kjua({
					text: `${$('meta[name=baseUrl]').attr('content')}/courses?import=${data.shareToken}`,
					render: 'image',
				});
				const $shareqrbox = $('.course-qr');
				$shareqrbox.empty();
				// eslint-disable-next-line max-len
				$shareqrbox.append('<p>Alternativ kannst du deinen Lehrer-Kollegen auch folgenden QR-Code zeigen. </p>');
				$shareqrbox.append(image);
			},
		});
	});
});
