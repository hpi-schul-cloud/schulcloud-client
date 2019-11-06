$(document).ready(() => {
	$('.js-course-name-input').change(function () {
		$(this).val($(this).val().trim());
	});

	$('.btn-hidden-toggle').click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		let $hiddenToggleBtn = $(this);
		let $hiddenToggleIcon = $(this).find('.fa');
		let $card = $(this).closest('.card');
		const href = $(this).attr('href');
		$.ajax({
			method: 'PATCH',
			url: `${href}?json=true`,
			data: { hidden: !$hiddenToggleIcon.hasClass('fa-eye-slash') },
			success(result) {
                if (result.hidden) {
                    $hiddenToggleIcon.addClass('fa-eye-slash');
                    $hiddenToggleIcon.removeClass('fa-eye');
                    $hiddenToggleBtn.attr('data-original-title', "Thema sichtbar machen");
                    $card.addClass('card-transparent');
                } else {
                    $hiddenToggleIcon.removeClass('fa-eye-slash');
                    $hiddenToggleIcon.addClass('fa-eye');
                    $hiddenToggleBtn.attr('data-original-title', "Thema verstecken");
                    $card.removeClass('card-transparent');
                }
            },
		});
	});

	$('.btn-create-invitation').click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		const target = `${$(this).attr("data-href")  }addStudent`;
		const $invitationModal = $('.invitation-modal');
		$.ajax({
			type: 'POST',
			url: '/link/',
			beforeSend(xhr) {
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
                    fields: {invitation: data.newUrl}
                });
                $invitationModal.find('.btn-submit').remove();
                $invitationModal.find("input[name='invitation']").click(function () {
                    $(this).select();
                });

                $invitationModal.appendTo('body').modal('show');

            },
		});
	});


	$('.btn-import-topic').click(function (e) {
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
			update(event, ui) {
                let positions = {};
                $( "#topic-list .card-topic" ).each(function(i) {
                    positions[($( this ).attr("data-topicId"))] = i;
                });
                const courseId = $( this ).attr("data-courseId");
                $.ajax({
                    type: "PATCH",
                    url: `/courses/${courseId}/positions`,
                    data: positions
                });
            },
		});

		$('#topic-list').disableSelection();
	}

	$('.btn-create-share-course').click(function (e) {
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
                    fields: {shareToken: data.shareToken}
                });
                $shareModal.find('.btn-submit').remove();
                $shareModal.find("input[name='shareToken']").click(function () {
                    $(this).select();
                });

                $shareModal.appendTo('body').modal('show');

                $("label[for='shareToken']").text('Verteile folgenden Code an einen Lehrer-Kollegen, um den Kurs mit diesem zu teilen. Die Funktion befindet sich auf der Übersichtsseite für Kurse.');
                let image = kjua({text: $('meta[name=baseUrl]').attr("content") + '/courses?import=' + data.shareToken, render: 'image'});
                let $shareqrbox = $('.course-qr');
                $shareqrbox.empty();
                $shareqrbox.append('<p>Alternativ kannst du deinen Lehrer-Kollegen auch folgenden QR-Code zeigen. </p>')
                $shareqrbox.append(image);
            },
		});
	});
});
