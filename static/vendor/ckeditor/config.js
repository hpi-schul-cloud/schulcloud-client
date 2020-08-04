/* global CKEDITOR */
/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.editorConfig = (config) => {
	// Define changes to default configuration here.
	// For complete reference see:
	// https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_config.html

	config.skin = 'n1theme';
	config.language = 'de';

	// non preinstalled plugins
	config.extraPlugins = [
		'colorbutton',
		'colordialog',
		'mathjax',
		'html5video',
		'html5audio',
		'autogrow',
	].join(',');

	// The toolbar groups arrangement, optimized for two toolbar rows.
	config.toolbarGroups = [
		{ name: 'clipboard', groups: ['undo', 'clipboard'] },
		{ name: 'editing', groups: ['find', 'selection', 'spellchecker', 'editing'] },
		{ name: 'forms', groups: ['forms'] },
		{ name: 'insert', groups: ['insert'] },
		{ name: 'links', groups: ['links'] },
		{ name: 'document', groups: ['mode', 'doctools', 'document'] },
		'/',
		{ name: 'styles', groups: ['styles'] },
		{ name: 'paragraph', groups: ['list', 'indent', 'blocks', 'bidi', 'align', 'paragraph'] },
		{ name: 'colors', groups: ['colors'] },
		{ name: 'basicstyles', groups: ['basicstyles', 'cleanup'] },
		{ name: 'tools', groups: ['tools'] },
		{ name: 'others', groups: ['others'] },
		{ name: 'about', groups: ['about'] },
	];

	config.removePlugins = ['elementspath'].join(',');

	config.removeButtons = [
		'Source',
		'Save',
		'NewPage',
		'Preview',
		'Templates',
		'PasteFromWord',
		'Replace',
		'Find',
		'SelectAll',
		'Scayt',
		'Form',
		'TextField',
		'Textarea',
		'Select',
		'Button',
		'ImageButton',
		'HiddenField',
		'Radio',
		'CreateDiv',
		'JustifyBlock',
		'JustifyRight',
		'JustifyCenter',
		'JustifyLeft',
		'BidiLtr',
		'BidiRtl',
		'Language',
		'Flash',
		'Smiley',
		'PageBreak',
		'Iframe',
		'ShowBlocks',
		'Maximize',
		'About',
		'Checkbox',
		'Anchor',
		'Styles',
		'Font',
		'CopyFormatting',
	].join(',');

	config.mathJaxLib = '/vendor-optimized/mathjax/MathJax.js?config=TeX-AMS_HTML';

	// Set the most common block elements.
	config.format_tags = ['p', 'h1', 'h2', 'h3', 'h4', 'pre'].join(';');

	config.colorButton_enableAutomatic = true;
	// https://materialuicolors.co/
	config.colorButton_colors = [
		'F44336', 'E91E63', '9C27B0', '673AB7', '3F51B5',
		'2196F3', '03A9F4', '00BCD4', '009688', '4CAF50',
		'8BC34A', 'CDDC39', 'FFEB3B', 'FFC107', 'FF9800',
		'FF5722', '795548', '9E9E9E', '607D8B', '000000', 'FFFFFF',
	].join(',');

	config.DefaultLinkTarget = '_blank';

	config.autoGrow_onStartup = true;
	config.autoGrow_minHeight = 200;
	config.autoGrow_maxHeight = 0;

	config.uploadUrl = '/files/upload/?path=/my';
	config.filebrowserBrowseUrl = '/files/my';
	config.filebrowserUploadUrl = '/files/upload/?path=/my';
	config.filebrowserImageUploadUrl = '/files/upload/?path=/my';
};

CKEDITOR.on('dialogDefinition', (ev) => {
	const dialogName = ev.data.name;
	const dialogDefinition = ev.data.definition;
	ev.data.definition.resizable = CKEDITOR.DIALOG_RESIZE_NONE;

	// for debugging when changinging settings
	// console.log('dialogName', dialogName);
	// console.log('dialogDefinition', dialogDefinition);

	if (dialogName === 'link') {
		dialogDefinition.removeContents('advanced');
		dialogDefinition.removeContents('target');

		const infoTab = dialogDefinition.getContents('info');
		const protocolField = infoTab.get('protocol');
		if (protocolField) {
			protocolField.default = 'https://';
		}
	}

	if (dialogName === 'image') {
		dialogDefinition.removeContents('Link');
		dialogDefinition.removeContents('advanced');
		dialogDefinition.removeContents('Upload');

		const infoTab = dialogDefinition.getContents('info');
		infoTab.remove('txtHeight');
		infoTab.remove('txtWidth');
		infoTab.remove('txtBorder');
		infoTab.remove('txtHSpace');
		infoTab.remove('txtVSpace');
		infoTab.remove('cmbAlign');
		infoTab.remove('htmlPreview');
	}

	if (dialogName === 'html5video') {
		dialogDefinition.removeContents('Upload');
		dialogDefinition.removeContents('advanced');

		const infoTab = dialogDefinition.getContents('info');
		infoTab.elements = [infoTab.elements[0]];
	}

	if (dialogName === 'html5audio') {
		dialogDefinition.removeContents('Upload');
		dialogDefinition.removeContents('advanced');

		const infoTab = dialogDefinition.getContents('info');
		infoTab.elements = [infoTab.elements[0]];
	}

	if (dialogName === 'table') {
		const infoTab = dialogDefinition.getContents('info');
		const border = infoTab.get('txtBorder');
		border.default = 1;
		// infoTab.remove('txtBorder');
		infoTab.remove('cmbAlign');
		infoTab.remove('txtWidth');
		infoTab.remove('txtHeight');
		infoTab.remove('txtCellSpace');
		infoTab.remove('txtCellPad');
		infoTab.remove('txtCaption');
		infoTab.remove('txtSummary');
	}
});
