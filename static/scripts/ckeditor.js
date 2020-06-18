import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import EssentialsPlugin from '@ckeditor/ckeditor5-essentials/src/essentials';
import UploadAdapterPlugin from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import BoldPlugin from '@ckeditor/ckeditor5-basic-styles/src/bold';
import ItalicPlugin from '@ckeditor/ckeditor5-basic-styles/src/italic';
import BlockQuotePlugin from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import EasyImagePlugin from '@ckeditor/ckeditor5-easy-image/src/easyimage';
import ImagePlugin from '@ckeditor/ckeditor5-image/src/image';
import ImageCaptionPlugin from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImageStylePlugin from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageToolbarPlugin from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageUploadPlugin from '@ckeditor/ckeditor5-image/src/imageupload';
import LinkPlugin from '@ckeditor/ckeditor5-link/src/link';
import ListPlugin from '@ckeditor/ckeditor5-list/src/list';
import ParagraphPlugin from '@ckeditor/ckeditor5-paragraph/src/paragraph';
// import MathType from '@wiris/mathtype-ckeditor5';
// import HorizontalLine from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline';

window.addEventListener('DOMContentLoaded', async () => {
	document.querySelectorAll('.ckeditor').forEach(async (element) => {
		const editor = await ClassicEditor.create(element, {
			// language: 'de',
			plugins: [
				EssentialsPlugin,
				BoldPlugin,
				ItalicPlugin,
				BlockQuotePlugin,
				ImagePlugin,
				ImageCaptionPlugin,
				ImageStylePlugin,
				ImageToolbarPlugin,
				EasyImagePlugin,
				ImageUploadPlugin,
				LinkPlugin,
				ListPlugin,
				ParagraphPlugin,
				UploadAdapterPlugin,
			],
			toolbar: ['undo', 'redo', '|',
				'imageUpload', 'mediaEmbed', 'ckfinder', 'insertTable', 'link'],
		});
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
