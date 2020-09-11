import AutoformatPlugin from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import BlockQuotePlugin from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import BoldPlugin from '@ckeditor/ckeditor5-basic-styles/src/bold';
import CodePlugin from '@ckeditor/ckeditor5-basic-styles/src/code';
import EssentialsPlugin from '@ckeditor/ckeditor5-essentials/src/essentials';
import FontPlugin from '@ckeditor/ckeditor5-font/src/font';
import HeadingPlugin from '@ckeditor/ckeditor5-heading/src/heading';
import HorizontalLinePlugin from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline';
import ImagePlugin from '@ckeditor/ckeditor5-image/src/image';
import ImageResizePlugin from '@ckeditor/ckeditor5-image/src/imageresize';
import IndentPlugin from '@ckeditor/ckeditor5-indent/src/indent';
import ItalicPlugin from '@ckeditor/ckeditor5-basic-styles/src/italic';
import LinkPlugin from '@ckeditor/ckeditor5-link/src/link';
import ListPlugin from '@ckeditor/ckeditor5-list/src/list';
import MathPlugin from 'ckeditor5-math/src/math';
import MediaEmbedPlugin from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import ParagraphPlugin from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOfficePlugin from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
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

import FileBrowserPlugin from './plugins/ckeditor5-filebrowser/src/filebrowser';
import HelpLinkPlugin from './plugins/ckeditor5-helplink/src/helplink';

// Material Design Colors: https://materialuicolors.co/
const fontColors = [
	{
		color: '#F44336',
	},
	{
		color: '#E91E63',
	},
	{
		color: '#9C27B0',
	},
	{
		color: '#673AB7',
	},
	{
		color: '#3F51B5',
	},
	{
		color: '#2196F3',
	},
	{
		color: '#03A9F4',
	},
	{
		color: '#00BCD4',
	},
	{
		color: '#009688',
	},
	{
		color: '#4CAF50',
	},
	{
		color: '#8BC34A',
	},
	{
		color: '#CDDC39',
	},
	{
		color: '#FFEB3B',
	},
	{
		color: '#FFC107',
	},
	{
		color: '#FF9800',
	},
	{
		color: '#FF5722',
	},
	{
		color: '#795548',
	},
	{
		color: '#9E9E9E',
	},
	{
		color: '#607D8B',
	},
	{
		color: '#000000',
	},
	{
		color: '#FFFFFF',
	},
];

const ckeditorConfig = {
	language: 'de',
	plugins: [
		AutoformatPlugin,
		BlockQuotePlugin,
		BoldPlugin,
		CodePlugin,
		EssentialsPlugin,
		FileBrowserPlugin,
		FontPlugin,
		HeadingPlugin,
		HelpLinkPlugin,
		HorizontalLinePlugin,
		ImagePlugin,
		ImageResizePlugin,
		IndentPlugin,
		ItalicPlugin,
		LinkPlugin,
		ListPlugin,
		MathPlugin,
		MediaEmbedPlugin,
		ParagraphPlugin,
		PasteFromOfficePlugin,
		RemoveFormatPlugin,
		SpecialCharacterEssentialPlugin,
		SpecialCharacterPlugin,
		StrikethroughPlugin,
		SubscriptPlugin,
		SuperscriptPlugin,
		TableCellPropertiesPlugin,
		TablePlugin,
		TablePropertiesPlugin,
		TableToolbarPlugin,
		UnderlinePlugin,
	],
	toolbar: [
		'undo', 'redo', '|',
		'heading', '|',
		'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript',
		'fontColor', 'fontBackgroundColor',
		'removeFormat', '|',
		'blockQuote', 'code', 'horizontalLine', '|',
		'numberedList', 'bulletedList', '|',
		'specialCharacters', 'math', 'insertTable', '|',
		'link', 'imagebrowser', 'videobrowser', 'audiobrowser', 'mediaEmbed', '|',
		'helplink', '|',
	],
	fontColor: {
		colors: fontColors,
	},
	fontBackgroundColor: {
		colors: fontColors,
	},
	table: {
		contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
	},
	math: {
		engine: 'mathjax',
		outputType: 'span',
		forceOutputType: false,
		enablePreview: true,
	},
	filebrowser: {
		browseUrl: '/files/my',
	},
};

export default ckeditorConfig;
