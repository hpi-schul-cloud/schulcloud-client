import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';

import BlockQuotePlugin from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import BoldPlugin from '@ckeditor/ckeditor5-basic-styles/src/bold';
import CKFinderPlugin from '@ckeditor/ckeditor5-ckfinder/src/ckfinder';
import EasyImagePlugin from '@ckeditor/ckeditor5-easy-image/src/easyimage';
import EssentialsPlugin from '@ckeditor/ckeditor5-essentials/src/essentials';
import FontPlugin from '@ckeditor/ckeditor5-font/src/font';
import HeadingPlugin from '@ckeditor/ckeditor5-heading/src/heading';
import HorizontalLinePlugin from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline';
import ImageCaptionPlugin from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImagePlugin from '@ckeditor/ckeditor5-image/src/image';
import ImageStylePlugin from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageToolbarPlugin from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageUploadPlugin from '@ckeditor/ckeditor5-image/src/imageupload';
import IndentPlugin from '@ckeditor/ckeditor5-indent/src/indent';
import ItalicPlugin from '@ckeditor/ckeditor5-basic-styles/src/italic';
import LinkPlugin from '@ckeditor/ckeditor5-link/src/link';
import ListPlugin from '@ckeditor/ckeditor5-list/src/list';
import MediaEmbedPlugin from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import ParagraphPlugin from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import RemoveFormatPlugin from '@ckeditor/ckeditor5-remove-format/src/removeformat';
import SpecialCharacterEssentialPlugin from '@ckeditor/ckeditor5-special-characters/src/specialcharactersessentials';
import SpecialCharacterPlugin from '@ckeditor/ckeditor5-special-characters/src/specialcharacters';
import StrikethroughPlugin from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import SubscriptPlugin from '@ckeditor/ckeditor5-basic-styles/src/subscript';
import SuperscriptPlugin from '@ckeditor/ckeditor5-basic-styles/src/superscript';
import TablePlugin from '@ckeditor/ckeditor5-table/src/table';
import UnderlinePlugin from '@ckeditor/ckeditor5-basic-styles/src/underline';
import UploadAdapterPlugin from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';

window.addEventListener('DOMContentLoaded', async () => {
	document.querySelectorAll('.ckeditor').forEach(async (element) => {
		const editor = await ClassicEditor.create(element, {
			language: 'de',
			plugins: [
				BlockQuotePlugin,
				BoldPlugin,
				CKFinderPlugin,
				EasyImagePlugin,
				EssentialsPlugin,
				FontPlugin,
				HeadingPlugin,
				HorizontalLinePlugin,
				ImageCaptionPlugin,
				ImagePlugin,
				ImageStylePlugin,
				ImageToolbarPlugin,
				ImageUploadPlugin,
				IndentPlugin,
				ItalicPlugin,
				LinkPlugin,
				ListPlugin,
				MediaEmbedPlugin,
				ParagraphPlugin,
				RemoveFormatPlugin,
				SpecialCharacterEssentialPlugin,
				SpecialCharacterPlugin,
				StrikethroughPlugin,
				SubscriptPlugin,
				SuperscriptPlugin,
				TablePlugin,
				UnderlinePlugin,
				UploadAdapterPlugin,
			],
			toolbar: ['undo', 'redo', '|',
				'imageUpload', 'mediaEmbed', 'MathType', 'ckfinder', 'insertTable', 'specialCharacters', 'link', '|',
				'heading', '|',
				'numberedList', 'bulletedList', '|',
				'outdent', 'indent', '|',
				'blockQuote', 'fontColor', 'fontBackgroundColor', 'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', '|',
				'removeFormat',
			],
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
