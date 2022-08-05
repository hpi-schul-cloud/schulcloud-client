import Command from '@ckeditor/ckeditor5-core/src/command';
import getCookie from '../../../../helpers/cookieManager';
import createFilebrowserModal from './file-browser-modal';

const apiV3BasePath = '/api/v3';

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
				imageUrl = await this.copyAsLessonFile(schoolId, 'lessons', topicId, courseFileUrl);
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

	async copyAsLessonFile(schoolId, parentType, parentId, url) {
		const regex = new RegExp('(?<=name=).+', 'g');
		const fileNameMatch = url.match(regex);

		if (!fileNameMatch) return;

		const fileRecord = await $.ajax(`${apiV3BasePath}/file/upload-from-url/${schoolId}/${parentType}/${parentId}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${getCookie('jwt')}`,
			},
			data: { url: `${window.location.origin}${url}`, fileName: `${fileNameMatch[0]}` },
		});

		return `/api/v3/file/download/${fileRecord.id}/${fileRecord.name}`;
	}
}
