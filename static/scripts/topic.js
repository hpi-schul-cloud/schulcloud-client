$(document).ready(function () {
    var $modals = $('.modal');
    var $externalLinkModal = $('.external-link-modal');

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

    $('.external-link').on('click', function () {
        populateModalForm($externalLinkModal, {
                title: 'Sie verlassen jetzt die Schul-Cloud',
                closeLabel: 'Abbrechen',
        });
        $externalLinkModal.find('.external-link-btn').attr('href', $(this).data('external-link'));
        var provider = $externalLinkModal.find('.provider');
        provider.html($(this).data('provider') || provider.html());
        $externalLinkModal.modal('show');
    });

    $modals.find('.close, .btn-close, .external-link-btn').on('click', function () {
        $modals.modal('hide');
    });
});
