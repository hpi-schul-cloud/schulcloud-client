import Command from '@ckeditor/ckeditor5-core/src/command';
import createFilebrowserModal from './file-browser-modal';

export default class ImageBrowserCommand extends Command {
	execute() {
		const additionalInput = `<br><label for="alt-text-input">${this.editor.t('Alternative Text')}:</label>
		  <input type="text" id="alt-text-input">`;
		const dialogTitle = this.editor.t('Image Properties');
		const onCreate = () => {
			const imageUrl = document.getElementById('url-input').value;
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
}