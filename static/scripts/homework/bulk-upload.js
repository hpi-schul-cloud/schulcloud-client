import { uploadSubmissionFile } from './api-requests';

export default function (jQuery) {
	const $ = jQuery;

	function connectForm(
		element,
		{
			successAlert,
			warningAlert,
			parent = undefined,
			owner = undefined,
			hideClass = 'hidden',
		},
	) {
		const $element = $(element);

		function provideFeedback(unknown) {
			if (unknown.length > 0) {
				$(warningAlert)
					.removeClass(hideClass)
					.find('#bulk-grading-error-files')
					.text(unknown.map((file) => file.name).join(', '));
			} else {
				$(successAlert).removeClass(hideClass);
			}
		}

		$element.find('input[type=file]').on('change', function onFileUpload() {
			$(successAlert).addClass(hideClass);
			$(warningAlert).addClass(hideClass);

			const knownFileNames = JSON.parse(this.dataset.knownFileNames);
			const files = Array.from(this.files);

			const unknown = files.filter((file) => !knownFileNames[file.name]);
			Promise.all(
				files
					.filter((file) => !!knownFileNames[file.name])
					.map((file) => {
						const { submissionId, teamMembers } = knownFileNames[file.name];
						return uploadSubmissionFile({
							file,
							owner,
							parent,
							submissionId,
							teamMembers,
							associationType: 'grade-files',
						});
					}),
			).then(
				() => provideFeedback(unknown),
				(error) => $.showNotification(error.message, 'danger'),
			);
		});
	}

	// This indirection is needed in case multiple upload forms are in one document.
	jQuery.fn.extend({
		connectBulkUpload: function bulkUpload(options) {
			this.each(function connectSingleBulkUpload() {
				connectForm(this, options);
			});
			return this;
		},
	});
}
