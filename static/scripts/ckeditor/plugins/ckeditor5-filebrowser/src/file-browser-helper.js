import getCookie from '../../../../helpers/cookieManager';
import { apiV3FileStorageBasePath, getFileDownloadUrl } from '../../../../helpers/storage';

export default class FileBrowserHelper {
	static async getFileUrl() {
		const courseFileUrl = $('#url-input').val();

		const parentId = $('.ckeditor').data('parent-id');
		const schoolId = $('.ckeditor').data('school-id');
		const parentType = $('.ckeditor').data('parent-type');

		if (parentId !== undefined && schoolId !== undefined && parentType !== undefined) {
			return this.copyFile(schoolId, parentType, parentId, courseFileUrl);
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
