import getCookie from '../../../../helpers/cookieManager';
import { apiV3FileStorageBasePath, getFileDownloadUrl } from '../../../../helpers/storage';

export default class FileBrowserHelper {
	static async getFileUrl() {
		const courseFileUrl = $('#url-input').val();

		const parentId = $('.ckeditor').data('id');
		const schoolId = $('.ckeditor').data('school');
		const parentType = $('.ckeditor').data('type');

		if (parentId !== undefined && schoolId !== undefined && parentType !== undefined) {
			return this.copyFile(schoolId, parentType, parentId, courseFileUrl);
		}

		const topicId = $('#content-blocks').data('parent-id');
		const topicSchoolId = $('#content-blocks').data('school');
		const topicParentType = $('#content-blocks').data('parent-type');

		if (topicId !== undefined && topicSchoolId !== undefined && topicParentType !== undefined) {
			return this.copyFile(topicSchoolId, topicParentType, topicId, courseFileUrl);
		}

		return courseFileUrl;
	}

	static async copyFile(schoolId, parentType, parentId, url) {
		const fileNameMatch = url.match(/(?<=name=).+/);

		if (!fileNameMatch) {
			return undefined;
		}

		const headers = { Authorization: `Bearer ${getCookie('jwt')}` };
		const fileRecord = await $.ajax(`${apiV3FileStorageBasePath}/upload-from-url/${schoolId}/${parentType}/${parentId}`, {
			method: 'POST',
			headers,
			data: {
				url: `${window.location.origin}${url}`,
				fileName: `${fileNameMatch[0]}`,
				headers: {
					cookie: document.cookie,
				},
			},
		});

		return getFileDownloadUrl(fileRecord.id, fileRecord.name);
	}
}
