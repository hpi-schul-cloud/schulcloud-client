import { resizeIframes } from './helpers/iFrameResize';

resizeIframes();

$(document).on('load', function topicHandler() {
	$('.btn-create-share').on('click', function click(e) {
		e.stopPropagation();
		e.preventDefault();
		const topicId = $(this).attr('data-href');
		const courseId = $(this).attr('data-courseId');
		const $shareModal = $('.share-topic-modal');
		$.ajax({
			type: 'POST',
			url: `/courses/${courseId}/topics/${topicId}/share/`,
			success: function success(data) {
				populateModalForm($shareModal, {
					title: $t('courses._course.headline.shareCodeGenerated'),
					closeLabel: $t('global.button.close'),
					fields: { shareToken: data.shareToken },
				});
				$shareModal.find('.btn-submit').remove();
				$shareModal.find("input[name='shareToken']").on('click', function click() {
					$(this).select();
				});
				$shareModal.appendTo('body').modal('show');
			}
		});
	});
});
