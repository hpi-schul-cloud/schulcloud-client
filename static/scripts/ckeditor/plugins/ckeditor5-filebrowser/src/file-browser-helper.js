import getCookie from '../../../../helpers/cookieManager';
import { apiV3BasePath, getFileDownloadUrl } from '../../../../helpers/storage';

export default class FileBrowserHelper {
	static async getFileUrl() {
		const topicId = $('#content-blocks').data('topicid');
		const schoolId = $('#content-blocks').data('schoolid');
		const courseFileUrl = $('#url-input').val();

		if (topicId !== undefined && schoolId !== undefined) {
			return this.copyAsLessonFile(schoolId, 'lessons', topicId, courseFileUrl);
		}

		return courseFileUrl;
	}

	static async copyAsLessonFile(schoolId, parentType, parentId, url) {
		const fileNameMatch = url.match(/(?<=name=).+/);

		if (!fileNameMatch) {
			return undefined;
		}

		const headers = { Authorization: `Bearer ${getCookie('jwt')}` };
		const fileRecord = await $.ajax(`${apiV3BasePath}/file/upload-from-url/${schoolId}/${parentType}/${parentId}`, {
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
