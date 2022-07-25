import Command from '@ckeditor/ckeditor5-core/src/command';

const createFilebrowserModal = (editor, t, dialogTitle, onCreate, additionalInput = '') => {
	const ckeditorFilebrowserDialog = $('.ckeditor-filebrowser-dialog');
	populateModalForm(ckeditorFilebrowserDialog, {
		title: dialogTitle,
		closeLabel: t('Cancel'),
		submitLabel: t('OK'),
	});

	const dialogContent = `<label for="url-input" style="display: none">${t('URL')}:</label>
		<input type="hidden" id="url-input">
		<input type="hidden" id="editor-id">
		<button type="button" id="browseServerButton">${t('Browse Server')}</button><br>${additionalInput}`;

	ckeditorFilebrowserDialog.find('.modal-body').html(dialogContent);
	ckeditorFilebrowserDialog.find('.btn-submit').on('click', () => {
		ckeditorFilebrowserDialog.modal('hide');
		onCreate();
	});
	ckeditorFilebrowserDialog.appendTo('body').modal('show');

	document.getElementById('editor-id').value = editor.id;
	window.addEventListener('message', (e) => {
		document.getElementById('url-input').value = e.data;
	});

	ckeditorFilebrowserDialog.find('#browseServerButton').on('click', () => {
		const dialogPageUrl = `${editor.config.get('filebrowser.browseUrl')}?CKEditor=true`;
		window.open(dialogPageUrl, '_blank', 'width=700, height=500');
	});
};

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