/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function (config) {
	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	// The toolbar groups arrangement, optimized for two toolbar rows.
	config.toolbarGroups = [
		{ name: 'clipboard', groups: ['undo', 'clipboard'] },
		{ name: 'forms' },
		{ name: 'insert' },
		{ name: 'links' },
		{ name: 'editing', groups: ['find', 'selection', 'spellchecker'] },
		{ name: 'others' },
		{ name: 'about' },
		{ name: 'document', groups: ['mode', 'document', 'doctools'] },
		{ name: 'tools' },
		'/',
		{ name: 'styles' },
		{ name: 'colors', groups: ['colors'] },
		{ name: 'basicstyles', groups: ['basicstyles'] },
		{ name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi'] },
		{ name: 'colors', groups: ['colors'] },
		{ name: 'basicstyles', groups: ['cleanup'] },
	];

	// Remove some buttons provided by the standard plugins, which are
	// not needed in the Standard(s) toolbar.
	config.removeButtons = 'Subscript,Superscript,Source,PasteFromWord,Maximize';

	// add color picker
	config.extraPlugins = 'mathjax,colorbutton,colordialog,print';
	config.mathJaxLib = '/vendor-optimized/mathjax/MathJax.js?config=TeX-AMS_HTML';

	// Set the most common block elements.
	config.format_tags = 'p;h1;h2;h3;pre';

	// Simplify the dialog windows.
	config.removeDialogTabs = 'image:advanced;link:advanced';
};
