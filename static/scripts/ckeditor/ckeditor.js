import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import ckeditorConfig from './ckeditor-config';

const url = window.location.pathname;
const urlParts = url.split('/');

const setStorageContext = () => {
	if (urlParts[1] === 'homework') {
		let storageContext;
		if (urlParts[2] === 'new' || urlParts[3] === 'edit') {
			const course = document.getElementById('coursePicker').value;
			storageContext = `/files/courses/${course}`;
			if (!course) {
				// Show error
				storageContext = '/files/courses/';
			}
		} else {
			storageContext = document.getElementById('courseId').getAttribute('href') || 'courses';
		}
		ckeditorConfig.filebrowser.browseUrl = storageContext;
	}
};

const initEditor = async (element) => {
	setStorageContext();

	const editor = await ClassicEditor.create(element, ckeditorConfig);

	if (urlParts[1] === 'homework' && (urlParts[2] === 'new' || urlParts[3] === 'edit')) {
		document.getElementById('coursePicker').onchange = () => {
			editor.destroy(element).then(initEditor(element));
		};
	}

	const isFileBrowserDisabled = 	$('.ckeditor').data('disable-file-browser');

	if (isFileBrowserDisabled) {
		editor.commands.get('imagebrowser').forceDisabled();
		editor.commands.get('audiobrowser').forceDisabled();
		editor.commands.get('videobrowser').forceDisabled();
	}

	editor.model.document.on('change:data', () => {
		editor.updateSourceElement();
		const submitButton = document.querySelector('.ckeditor-submit');
		if (submitButton) {
			const editorContent = editor.getData();
			const editorContainsText = editorContent !== '';
			submitButton.setAttribute('editorContainsText', editorContainsText);
			const fileIsUploaded = submitButton.getAttribute('fileIsUploaded');
			submitButton.disabled = !editorContainsText && !fileIsUploaded;
		}
	});
};

window.addEventListener('DOMContentLoaded', async () => {
	document.querySelectorAll('.ckeditor').forEach(async (element) => {
		await initEditor(element);
	});
});
