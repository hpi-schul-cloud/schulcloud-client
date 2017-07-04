$(document).ready(function () {
    $('.btn-create-share').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let target = "courses/importTopic/"+ $(this).attr("data-href");
        let $invitationModal = $('.invitation-modal');
        $.ajax({
            type: "POST",
            url: "/link/",
            data: {
                target: target
            },
            success: function(data) {
                console.log(data);
                console.log($invitationModal)
                populateModalForm($invitationModal, {
                    title: 'Kopierlink generiert!',
                    closeLabel: 'Schließen',
                    submitLabel: 'Speichern',
                    fields: {link: data.newUrl}
                });
                $invitationModal.find('.btn-submit').remove();
                $invitationModal.find("input[name='link']").click(function () {
                    $(this).select();
                });

                $invitationModal.modal('show');

            }
        });
    });
});
