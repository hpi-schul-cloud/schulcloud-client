/* eslint-disable import/prefer-default-export */
export async function createParent(parentType) {
	const isSubmissionFile = parentType === 'submissions';
	const formId = isSubmissionFile ? '#submission-form' : '#homework-form';
	const form = $(formId);

	const submissionUrl = isSubmissionFile ? '/submit' : '';
	const url = `/homework${submissionUrl}/silent`;
	try {
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
		}

		return entity._id;
	} catch (error) {
		window.location.href = '/error';
	}
}
