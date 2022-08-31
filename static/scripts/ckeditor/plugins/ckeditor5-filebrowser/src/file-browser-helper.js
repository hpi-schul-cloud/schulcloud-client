import getCookie from '../../../../helpers/cookieManager';
import { apiV3FileStorageBasePath, getFileDownloadUrl } from '../../../../helpers/storage';

export default class FileBrowserHelper {
	static async getFileUrl() {
		const topicId = $('#content-blocks').data('parent-id');
		const schoolId = $('#content-blocks').data('school');
		const parentType = $('#content-blocks').data('parent-type');
		const courseFileUrl = $('#url-input').val();

		if (topicId !== undefined && schoolId !== undefined) {
			return this.copyFile(schoolId, parentType, topicId, courseFileUrl);
		}

		return courseFileUrl;
	}

	static async copyFile(schoolId, parentType, parentId, url) {
		const fileNameMatch = url.match(/(?<=name=).+/);

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
					fileName: `${fileNameMatch[0]}`,
					headers: {
						cookie: document.cookie,
					},
				},
			},
		);

		return getFileDownloadUrl(fileRecord.id, fileRecord.name);
	}
}
