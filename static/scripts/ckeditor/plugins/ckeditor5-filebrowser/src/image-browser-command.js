import Command from '@ckeditor/ckeditor5-core/src/command';
import createFilebrowserModal from './file-browser-modal';
import getCookie from '../../../../helpers/cookieManager';

const apiV3BasePath = '/api/v3';
const apiV1BasePath = '/api/v1';

export default class ImageBrowserCommand extends Command {
	execute() {
		const additionalInput = `<br><label for="alt-text-input">${this.editor.t('Alternative Text')}:</label>
		  <input type="text" id="alt-text-input">`;
		const dialogTitle = this.editor.t('Image Properties');

		const onCreate = async () => {
			const topicId = $('#content-blocks').data('topicid');
			const schoolId = $('#content-blocks').data('schoolid');
			const courseFileUrl = document.getElementById('url-input').value;

			let imageUrl;

			if (topicId !== undefined && schoolId !== undefined) {
				const regex = new RegExp('(?<=/files/file\\?file=).+?(?=&)', 'g');
				const fileId = courseFileUrl.match(regex)[0];

				if (fileId === null) return;
				imageUrl = await this.getFileUrl(schoolId, 'lessons', topicId, fileId);
			} else {
				imageUrl = courseFileUrl;
			}

			if (!imageUrl) return;
			const imageAltText = document.getElementById('alt-text-input').value;
			this.editor.model.change((writer) => {
				const imageElement = writer.createElement('image', {
					src: imageUrl,
					alt: imageAltText,
				});
				const lastOpenedEditorId = document.getElementById('editor-id').value;
				if (lastOpenedEditorId === this.editor.id) {
					this.editor.model.insertContent(imageElement, this.editor.model.document.selection);
				}
			});
		};
		createFilebrowserModal(this.editor, this.editor.t, dialogTitle, onCreate, additionalInput);
	}

	async getFileUrl(schoolId, parentType, parentId, fileId) {
		const url = await $.ajax(`${apiV1BasePath}/fileStorage/signedUrl?file=${fileId}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${getCookie('jwt')}`,
			},
		});

		const fileRecord = await $.ajax(`${apiV3BasePath}/file/upload-from-url/${schoolId}/${parentType}/${parentId}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${getCookie('jwt')}`,
			},
			data: { url: url.url },
		});

		return `/api/v3/file/download/${fileRecord.id}/${fileRecord.name}`;
	}
}
