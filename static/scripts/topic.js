import { resizeIframes } from './helpers/iFrameResize';

resizeIframes();

$(document).ready(function () {
    $('.btn-create-share').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let topicId = $(this).attr("data-href");
        let courseId = $(this).attr("data-courseId");
        const $shareModal = $('.share-topic-modal');
        $.ajax({
            type: "POST",
            url: `/courses/${courseId}/topics/${topicId}/share/`,
            success: function(data) {
                populateModalForm($shareModal, {
                    title: $t('courses._course.headline.shareCodeGenerated'),
                    closeLabel: $t('global.button.close'),
                    fields: {shareToken: data.shareToken}
                });
                $shareModal.find('.btn-submit').remove();
                $shareModal.find("input[name='shareToken']").click(function () {
                    $(this).select();
                });

                $shareModal.appendTo('body').modal('show');

            }
        });
    });
});
