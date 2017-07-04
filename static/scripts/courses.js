$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
    $('.btn-hidden-toggle').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        var $hiddenToggleBtn = $(this);
        var $hiddenToggleIcon = $(this).find('.fa');
        $.ajax({
            method: 'PATCH',
            url: window.location.href + '/topics/' + $(this).attr('href') + '?json=true',
            data: {hidden: !$hiddenToggleIcon.hasClass('fa-eye-slash')},
            success: function(result) {
                if (result.hidden) {
                    $hiddenToggleIcon.addClass('fa-eye-slash');
                    $hiddenToggleIcon.removeClass('fa-eye');
                    $hiddenToggleBtn.attr('data-original-title', "Thema entsperren");
                } else {
                    $hiddenToggleIcon.removeClass('fa-eye-slash');
                    $hiddenToggleIcon.addClass('fa-eye');
                    $hiddenToggleBtn.attr('data-original-title', "Thema sperren");
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
            data: {
                target: target
            },
            success: function(data) {
                populateModalForm($invitationModal, {
                    title: 'Einladungslink generiert!',
                    closeLabel: 'Schließen',
                    submitLabel: 'Speichern',
                    fields: {invitation: data.newUrl}
                });
                $invitationModal.find('.btn-submit').remove();
                $invitationModal.find("input[name='invitation']").click(function () {
                    $(this).select();
                });

                $invitationModal.modal('show');

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
            closeLabel: 'Schließen',
            submitLabel: 'Speichern',
            fields: {courseId: courseId}
        });

        let $modalForm = $importModal.find(".modal-form");
        $modalForm.attr('action', `/courses/${courseId}/importTopic`);
        $importModal.modal('show');
    });
});
