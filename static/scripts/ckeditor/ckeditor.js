import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import ckeditorConfig from './ckeditor-config';

window.addEventListener('DOMContentLoaded', async () => {
	document.querySelectorAll('.ckeditor').forEach(async (element) => {
		const editor = await ClassicEditor.create(element, ckeditorConfig);
		editor.model.document.on('change:data', () => {
			const submitButton = document.querySelector('.ckeditor-submit');
			if (submitButton) {
				const editorContent = editor.getData();
				const editorContainsText = editorContent !== '';
				submitButton.setAttribute('editorContainsText', editorContainsText);
				const fileIsUploaded = submitButton.getAttribute('fileIsUploaded');
				submitButton.disabled = !editorContainsText && !fileIsUploaded;
			}
		});
	});
});
