import { apiV3FileStorageBasePath, getFileDownloadUrl } from '../../../../helpers/storage';
import { createParent } from '../../../../helpers/homework';

export default class FileBrowserHelper {
	static async getFileUrl(sourceElement) {
		const courseFileUrl = $('#url-input').val();

		let parentId = sourceElement.getAttribute('data-parent-id');
		const parentType = sourceElement.getAttribute('data-parent-type');
		const schoolId = sourceElement.getAttribute('data-school-id');
		const homeworkId = sourceElement.getAttribute('data-homework-id');

		if (parentId === '') {
			parentId = await createParent(parentType);

			sourceElement.setAttribute('data-parent-id', parentId);
			$('.section-upload').attr('data-parent-id', parentId);

			if (parentType === 'submissions' || parentType === 'gradings') {
				const referrer = `/homework/${homeworkId}#activetabid=submission`;
				$('input[name="referrer"]').val(referrer);
			} else {
				const referrer = `/homework/${parentId}`;
				$('input[name="referrer"]').val(referrer);
			}
		}

		if (parentId !== undefined && schoolId !== undefined && parentType !== undefined) {
			return this.copyFile(schoolId, parentType, parentId, courseFileUrl);
		}

		return courseFileUrl;
	}

	static async copyFile(schoolId, parentType, parentId, url) {
		const urlParams = new URLSearchParams(url.split('?')[1]);
		const fileId = urlParams.get('file');
		const fileName = urlParams.get('name');

		if (!fileName) {
			return undefined;
		}

		const signedUrlResponse = await $.ajax({
			url: `${window.location.origin}/files/signedurl?file=${fileId}&name=${fileName}`,
			method: 'GET',
		});

		const fileRecord = await $.ajax(
			`${apiV3FileStorageBasePath}/upload-from-url/school/${schoolId}/${parentType}/${parentId}`,
			{
				method: 'POST',
				data: {
					url: signedUrlResponse.url,
					fileName: `${fileName}`,
				},
			},
		);

		return getFileDownloadUrl(fileRecord.id, fileRecord.name);
	}
}
