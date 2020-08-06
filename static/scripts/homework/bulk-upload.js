import groupBy from 'lodash/groupBy';
import keys from 'lodash/keys';
import flatten from 'lodash/flatten';

import { uploadSubmissionFile, associateFilesWithSubmission } from './api-requests';

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

			const unknownUploadFiles = files.filter((file) => !knownFileNames[file.name]);
			const knownUploadFiles = files.filter((file) => !!knownFileNames[file.name]);

			Promise.all(
				knownUploadFiles.map((file) => uploadSubmissionFile({ file, owner, parent })),
			).then(
				(newFiles) => groupBy(newFiles, (fileModel) => knownFileNames[fileModel.name].submissionId),
			).then(
				(groupedFiles) => Promise.all(keys(groupedFiles).map((submissionId) => {
					const fileIds = groupedFiles[submissionId].map((file) => file._id);
					const teamMembers = new Set(flatten(groupedFiles[submissionId]
						.map((file) => knownFileNames[file.name].teamMemberIds)));

					return associateFilesWithSubmission(
						{
							fileIds,
							submissionId,
							associationType: 'grade-files',
							teamMembers: [...teamMembers],
						},
					);
				})),
			).then(
				() => provideFeedback(unknownUploadFiles),
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
