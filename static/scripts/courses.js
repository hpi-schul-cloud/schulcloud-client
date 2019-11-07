$(document).ready(function () {

    $('.js-course-name-input').change(function () {
        $(this).val($(this).val().trim());
    });

    $('.btn-hidden-toggle').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        var $hiddenToggleBtn = $(this);
        var $hiddenToggleIcon = $(this).find('.fa');
        var $card = $(this).closest('.card');
        const href = $(this).attr('href');
        $.ajax({
            method: 'PATCH',
            url: `${href}?json=true`,
            data: {hidden: !$hiddenToggleIcon.hasClass('fa-eye-slash')},
            success: function(result) {
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
            }
        });
    });

    $('.btn-create-invitation').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let target = $(this).attr("data-href") + 'addStudent';
        let $invitationModal = $('.invitation-modal');
        $.ajax({
            type: "POST",
            url: "/link/",
            beforeSend(xhr) {
                xhr.setRequestHeader('Csrf-Token', csrftoken);
            },
            data: {
                target: target
            },
            success: function(data) {
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

            }
        });
    });


    $('.btn-import-topic').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let courseId = $(this).attr("data-courseId");
        let $importModal = $('.import-modal');
        populateModalForm($importModal, {
            title: 'Thema importieren',
            closeLabel: 'Abbrechen',
            submitLabel: 'Speichern',
            fields: {courseId: courseId}
        });

        let $modalForm = $importModal.find(".modal-form");
        $modalForm.attr('action', `/courses/${courseId}/importTopic`);
        $importModal.appendTo('body').modal('show');
    });

	$('.btn-import-topic-from-template').click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		let courseId = $(this).attr("data-courseId");
		let $importModal = $('.import-modal-from-template');
		populateModalForm($importModal, {
			title: 'Thema aus Vorlage importieren',
			closeLabel: 'Abbrechen',
			submitLabel: 'Speichern',
			fields: {courseId: courseId}
		});

		let $modalForm = $importModal.find(".modal-form");
		$modalForm.attr('action', `/courses/${courseId}/importTopic`);
		$importModal.appendTo('body').modal('show');
	});

    $(".move-handle").click(function(e) {
        e.stopPropagation();
    });

    if ($('#topic-list').length) {
        $("#topic-list").sortable({
            placeholder: "ui-state-highlight",
            handle: '.move-handle',
            update: function(event, ui) {
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

        $( "#topic-list" ).disableSelection();
    }

    $('.btn-create-share-course').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let courseId = $(this).attr("data-courseId");
        let $shareModal = $('.share-modal');
        $.ajax({
            type: "GET",
            url: `/courses/${courseId}/share/`,
            success: function(data) {
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
            }
        });
    });
});
