import { Autoformat } from '@ckeditor/ckeditor5-autoformat/src/index';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote/src/index';
import {
	Bold, Code, Italic, Strikethrough, Subscript, Superscript, Underline,
} from '@ckeditor/ckeditor5-basic-styles/src/index';
import { Essentials } from '@ckeditor/ckeditor5-essentials/src/index';
import { Font } from '@ckeditor/ckeditor5-font/src/index';
import { Heading } from '@ckeditor/ckeditor5-heading/src/index';
import { HorizontalLine } from '@ckeditor/ckeditor5-horizontal-line/src/index';
import { Image, ImageResize } from '@ckeditor/ckeditor5-image/src/index';
import { Indent } from '@ckeditor/ckeditor5-indent/src/index';
import { Link } from '@ckeditor/ckeditor5-link/src/index';
import { List } from '@ckeditor/ckeditor5-list/src/index';
import Mathematics from 'ckeditor5-math/src/math';
import { MediaEmbed } from '@ckeditor/ckeditor5-media-embed/src/index';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph/src/index';
import { PasteFromOffice } from '@ckeditor/ckeditor5-paste-from-office/src/index';
import { RemoveFormat } from '@ckeditor/ckeditor5-remove-format/src/index';
import { SpecialCharactersEssentials, SpecialCharacters } from '@ckeditor/ckeditor5-special-characters/src/index';
import {
	TableCellProperties, Table, TableProperties, TableToolbar,
} from '@ckeditor/ckeditor5-table/src/index';

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
		Autoformat,
		BlockQuote,
		Bold,
		Code,
		Essentials,
		FileBrowserPlugin,
		Font,
		Heading,
		HelpLinkPlugin,
		HorizontalLine,
		Image,
		ImageResize,
		Indent,
		Italic,
		Link,
		List,
		Mathematics,
		MediaEmbed,
		Paragraph,
		PasteFromOffice,
		RemoveFormat,
		SpecialCharactersEssentials,
		SpecialCharacters,
		Strikethrough,
		Subscript,
		Superscript,
		TableCellProperties,
		Table,
		TableProperties,
		TableToolbar,
		Underline,
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
