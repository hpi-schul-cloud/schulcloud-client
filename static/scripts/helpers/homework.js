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

	// we need to fill empty "required" values from the return values
	if (parentType === 'tasks') {
		$('#name').val(entity.name);
		$('#availableDate').val(entity.availableDate);
		$('#homework-form').attr('action', `/homework/${entity._id}`);
		$('[name="_method"]').val('patch');

		if (dropzone) {
			$('[name="referrer"]')
				.val(`/homework/${entity._id}/edit?returnUrl=homework/${entity._id}`);
		}
		else {
			$('[name="referrer"]').val(`/homework/${entity._id}`);
		}
	}
	if (parentType === 'submissions') {
		form.attr('action', `/homework/submit/${entity._id}`);
		$('[name="_method"]').val('patch');
		form.addClass(entity._id);
	}

	return entity._id;
}
