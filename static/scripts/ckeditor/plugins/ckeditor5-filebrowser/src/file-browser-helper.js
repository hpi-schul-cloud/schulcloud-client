import getCookie from '../../../../helpers/cookieManager';
import { apiV3FileStorageBasePath, getFileDownloadUrl } from '../../../../helpers/storage';

export default class FileBrowserHelper {
	static async getFileUrl(sourceElement) {
		const courseFileUrl = $('#url-input').val();

		const parentId = sourceElement.getAttribute('data-parent-id');
		const parentType = sourceElement.getAttribute('data-parent-type');
		const schoolId = sourceElement.getAttribute('data-school-id');

		if (parentId !== undefined && schoolId !== undefined && parentType !== undefined) {
			return this.copyFile(schoolId, parentType, parentId, courseFileUrl);
		}

		return courseFileUrl;
	}

	static async copyFile(schoolId, parentType, parentId, url) {
		const fileNameMatch = url.split('name=')[1];

		if (!fileNameMatch) {
			return undefined;
		}

		const headers = { Authorization: `Bearer ${getCookie('jwt')}` };
		const fileRecord = await $.ajax(
			`${apiV3FileStorageBasePath}/upload-from-url/${schoolId}/${parentType}/${parentId}`,
			{
				method: 'POST',
				headers,
				data: {
					url: `${window.location.origin}${url}`,
					fileName: `${fileNameMatch}`,
					headers: {
						cookie: document.cookie,
					},
				},
			},
		);

		return getFileDownloadUrl(fileRecord.id, fileRecord.name);
	}
}
