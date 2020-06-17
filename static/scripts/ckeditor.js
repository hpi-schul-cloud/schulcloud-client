import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

window.addEventListener('DOMContentLoaded', async () => {
	document.querySelectorAll('.ckeditor').forEach(async (element) => {
		try {
			const editor = await ClassicEditor.create(element);
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
		} catch (e) {
			console.log('ERRRROR');
		}
	});
});
