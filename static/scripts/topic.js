$(document).ready(function () {
    $('.btn-create-share').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let topicId = $(this).attr("data-href");
        let courseId = $(this).attr("data-courseId");
        let $shareModal = $('.share-modal');
        $.ajax({
            type: "POST",
            url: `/courses/${courseId}/topics/${topicId}/share/`,
            success: function(data) {
                populateModalForm($shareModal, {
                    title: 'Kopiercode generiert!',
                    closeLabel: 'Abbrechen',
                    submitLabel: 'Speichern',
                    fields: {shareToken: data.shareToken}
                });
                $shareModal.find('.btn-submit').remove();
                $shareModal.find("input[name='shareToken']").click(function () {
                    $(this).select();
                });

                $shareModal.modal('show');

            }
        });
    });
});
