import Command from '@ckeditor/ckeditor5-core/src/command';
import FileBrowserHelper from './file-browser-helper';
import createFilebrowserModal from './file-browser-modal';

export default class AudioBrowserCommand extends Command {
	execute() {
		const { t } = this.editor;
		const dialogTitle = t('Audio Properties');
		const onCreate = async () => {
			const audioUrl = await FileBrowserHelper.getFileUrl();

			if (!audioUrl) return;
			this.editor.model.change((writer) => {
				const audioElement = writer.createElement('audio', {
					source: audioUrl,
					controls: 'true',
					controlslist: 'nodownload',
				});
				const lastOpenedEditorId = document.getElementById('editor-id').value;
				if (lastOpenedEditorId === this.editor.id) {
					this.editor.model.insertContent(audioElement, this.editor.model.document.selection);
				}
			});
		};
		createFilebrowserModal(this.editor, t, dialogTitle, onCreate);
	}
}
