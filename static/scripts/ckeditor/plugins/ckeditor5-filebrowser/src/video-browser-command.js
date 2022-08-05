import Command from '@ckeditor/ckeditor5-core/src/command';
import FileBrowserHelper from './file-browser-helper';
import createFilebrowserModal from './file-browser-modal';

export default class VideoBrowserCommand extends Command {
	execute() {
		const { t } = this.editor;
		const dialogTitle = t('Video Properties');
		const onCreate = async () => {
			const videoUrl = await FileBrowserHelper.getFileUrl();

			if (!videoUrl) return;
			this.editor.model.change((writer) => {
				const videoElement = writer.createElement('video', {
					source: videoUrl,
					controls: 'true',
					controlslist: 'nodownload',
				});
				const lastOpenedEditorId = document.getElementById('editor-id').value;
				if (lastOpenedEditorId === this.editor.id) {
					this.editor.model.insertContent(videoElement, this.editor.model.document.selection);
				}
			});
		};
		createFilebrowserModal(this.editor, t, dialogTitle, onCreate);
	}
}
