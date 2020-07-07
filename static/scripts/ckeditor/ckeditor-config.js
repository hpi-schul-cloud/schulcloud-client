// import MathPlugin from 'ckeditor5-math/src/math';
import BlockQuotePlugin from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import BoldPlugin from '@ckeditor/ckeditor5-basic-styles/src/bold';
import EssentialsPlugin from '@ckeditor/ckeditor5-essentials/src/essentials';
import FontPlugin from '@ckeditor/ckeditor5-font/src/font';
import HeadingPlugin from '@ckeditor/ckeditor5-heading/src/heading';
import HorizontalLinePlugin from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline';
import ImageCaptionPlugin from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImagePlugin from '@ckeditor/ckeditor5-image/src/image';
import ImageStylePlugin from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageToolbarPlugin from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageResizePlugin from '@ckeditor/ckeditor5-image/src/imageresize';
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
import TableCellPropertiesPlugin from '@ckeditor/ckeditor5-table/src/tablecellproperties';
import TablePlugin from '@ckeditor/ckeditor5-table/src/table';
import TablePropertiesPlugin from '@ckeditor/ckeditor5-table/src/tableproperties';
import TableToolbarPlugin from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import UnderlinePlugin from '@ckeditor/ckeditor5-basic-styles/src/underline';
import TodoListPlugin from '@ckeditor/ckeditor5-list/src/todolist';
import PasteFromOfficePlugin from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import HighlightPlugin from '@ckeditor/ckeditor5-highlight/src/highlight';
import ExportPDFPlugin from '@ckeditor/ckeditor5-export-pdf/src/exportpdf';
import ExportWordPlugin from '@ckeditor/ckeditor5-export-word/src/exportword';
import MathTypePlugin from '@wiris/mathtype-ckeditor5/src/plugin';

import FileBrowserPlugin from './plugins/ckeditor5-filebrowser/src/filebrowser';


const ckeditorConfig = {
	language: 'de',
	plugins: [
		BlockQuotePlugin,
		BoldPlugin,
		EssentialsPlugin,
		FontPlugin,
		HeadingPlugin,
		HorizontalLinePlugin,
		ImageCaptionPlugin,
		ImagePlugin,
		ImageStylePlugin,
		ImageToolbarPlugin,
		ImageResizePlugin,
		IndentPlugin,
		ItalicPlugin,
		LinkPlugin,
		ListPlugin,
		// MathPlugin,
		MediaEmbedPlugin,
		ParagraphPlugin,
		RemoveFormatPlugin,
		SpecialCharacterEssentialPlugin,
		SpecialCharacterPlugin,
		StrikethroughPlugin,
		SubscriptPlugin,
		SuperscriptPlugin,
		TablePlugin,
		TablePropertiesPlugin,
		TableCellPropertiesPlugin,
		UnderlinePlugin,
		FileBrowserPlugin,
		TableToolbarPlugin,
		TodoListPlugin,
		PasteFromOfficePlugin,
		HighlightPlugin,
		ExportPDFPlugin,
		ExportWordPlugin,
		MathTypePlugin,
	],
	toolbar: [
		'undo', 'redo', '|',
		'mediaEmbed', 'MathType', 'ChemType', 'filebrowser', 'insertTable', 'horizontalLine', 'specialCharacters', 'link', '|',
		'heading', '|',
		'numberedList', 'bulletedList', 'todoList', '|',
		'outdent', 'indent', '|',
		'blockQuote', 'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor', 'highlight',
		'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', '|',
		'removeFormat', '|',
		'exportPdf', 'exportWord',
	],
	table: {
		contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
	},
	image: {
		toolbar: ['imageStyle:alignLeft', 'imageStyle:full', 'imageStyle:alignRight', '|', 'imageTextAlternative'],
		styles: ['full', 'alignLeft', 'alignRight'],
	},
	math: {
		engine: 'mathjax',
		outputType: 'script',
		forceOutputType: false,
		enablePreview: true,
	},
	filebrowser: {
		browseUrl: '/files/my?CKEditor=evaluation',
	},
};

export default ckeditorConfig;
