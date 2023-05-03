export async function createHomework(parentType, dropzone) {
	const isSubmissionFile = parentType === 'submissions';
	const formId = isSubmissionFile ? '#submission-form' : '#homework-form';
	const form = $(formId);

	const submissionUrl = isSubmissionFile ? '/submit' : '';
	const url = `/homework${submissionUrl}/create`;
	const entity = await $.ajax({
		url,
		type: 'post',
		data: form.serialize(),
	});

	form.attr('action', `/homework${submissionUrl}/${entity._id}`);
	$('[name="_method"]').val('patch');

	if (isSubmissionFile) {
		form.addClass(entity._id);
	} else {
		$('#name').val(entity.name);
		$('#availableDate').val(entity.availableDate);

		const editUrl = dropzone ? `/edit?returnUrl=homework/${entity._id}` : '';
		const referrer = `/homework/${entity._id}${editUrl}`;
		$('[name="referrer"]').val(referrer);
	}

	return entity._id;
}
