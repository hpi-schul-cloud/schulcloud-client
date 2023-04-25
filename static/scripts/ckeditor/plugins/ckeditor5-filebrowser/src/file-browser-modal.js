export default function createFilebrowserModal(editor, t, dialogTitle, onCreate, additionalInput = '') {
	const ckeditorFilebrowserDialog = $('.ckeditor-filebrowser-dialog');
	populateModalForm(ckeditorFilebrowserDialog, {
		title: dialogTitle,
		closeLabel: t('Cancel'),
		submitLabel: t('OK'),
		submitDataTestId: 'file-browser-modal',
	});

	const dialogContent = `<label for="url-input" style="display: none">${t('URL')}:</label>
		<input type="hidden" id="url-input">
		<input type="hidden" id="editor-id">
		<button type="button" id="browseServerButton">${t('Browse Server')}</button><br>${additionalInput}`;

	ckeditorFilebrowserDialog.find('.modal-body').html(dialogContent);
	ckeditorFilebrowserDialog.find('.btn-submit').on('click', async () => {
		ckeditorFilebrowserDialog.modal('hide');
		await onCreate();
		ckeditorFilebrowserDialog.find('.btn-submit').off('click');
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
}
