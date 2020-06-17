import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

window.addEventListener('DOMContentLoaded', async () => {
	try {
		const editor = await ClassicEditor.create(document.querySelector('#evaluation'));
		editor.model.document.on('change:data', () => {
			const editorContent = editor.getData();
			const submitButton = document.querySelector('#CKEditorSubmit');
			const editorContainsText = editorContent !== '';
			submitButton.setAttribute('editorContainsText', editorContainsText);
			const fileIsUploaded = submitButton.getAttribute('fileIsUploaded');
			submitButton.disabled = !editorContainsText && !fileIsUploaded;
			console.log(editor.getData());
		});
		console.log('hello world');
	} catch (e) {
		console.log('ERRRROR');
	}
});
