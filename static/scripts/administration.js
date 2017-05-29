$(document).ready(function () {

    var $modals = $('.modal');
    var $addModal = $('.add-modal');
    var $editModal = $('.edit-modal');
    var $invitationModal = $('.invitation-modal');

    $('.btn-add').on('click', function (e) {
        e.preventDefault();
        populateModalForm($addModal, {
            title: 'Hinzufügen',
            closeLabel: 'Schließen',
            submitLabel: 'Hinzufügen'
        });
        $addModal.modal('show');
    });

    $('.btn-edit').on('click', function (e) {
        e.preventDefault();
        var entry = $(this).attr('href');
        $.getJSON(entry, function (result) {
            populateModalForm($editModal, {
                action: entry,
                title: 'Bearbeiten',
                closeLabel: 'Schließen',
                submitLabel: 'Speichern',
                fields: result
            });

            // post-fill gradiation selection
            if ($editModal.find("input[name=gradeSystem]").length) {
                var $gradeInputPoints = $editModal.find("#gradeSystem0");
                var $gradeInputMarks = $editModal.find("#gradeSystem1");
                if(result.gradeSystem) {
                    $gradeInputMarks.attr("checked", true);
                    $gradeInputPoints.removeAttr("checked");
                } else {
                    $gradeInputPoints.attr("checked", true);
                    $gradeInputMarks.removeAttr("checked");
                }
            }
            populateCourseTimes($editModal, result.times || []);
            $editModal.modal('show');
        });
    });

    $('.btn-invitation-link').on('click', function (e) {
        e.preventDefault();
        let target = 'register/' + $invitationModal.find("input[name='schoolId']").attr("value");
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

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });

});