import '@hpi-schul-cloud/ckeditor/build/style-legacy.css';
import { LegacyClassicEditor } from '@hpi-schul-cloud/ckeditor/legacy';
import showFallbackImageOnError from '../helpers/showFallbackImageOnError';
import ckeditorConfig from './ckeditor-config';
import createFileBrowserAdapter from './file-browser-adapter';

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
			storageContext = document.getElementById('courseId')?.getAttribute('href') || '/files/courses';
		}
		ckeditorConfig.filebrowser.browseUrl = storageContext;
	}
};

const initEditor = async (element) => {
	setStorageContext();

	const config = {
		...ckeditorConfig,
		filebrowser: {
			adapter: createFileBrowserAdapter(element, ckeditorConfig.filebrowser.browseUrl),
		},
	};

	const editor = await LegacyClassicEditor.create(element, config);

	if (urlParts[1] === 'homework' && (urlParts[2] === 'new' || urlParts[3] === 'edit')) {
		document.getElementById('coursePicker').onchange = () => {
			editor.destroy().then(() => initEditor(element));
		};
	}

	showFallbackImageOnError();

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
