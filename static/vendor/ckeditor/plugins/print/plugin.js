/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview Print Plugin
 */

CKEDITOR.plugins.add( 'print', {
	// jscs:disable maximumLineLength
	lang: 'de,en', // %REMOVE_LINE_CORE%
	// jscs:enable maximumLineLength
	icons: 'print,', // %REMOVE_LINE_CORE%
	hidpi: true, // %REMOVE_LINE_CORE%
	init: function( editor ) {
		// Print plugin isn't available in inline mode yet.
		if ( editor.elementMode == CKEDITOR.ELEMENT_MODE_INLINE )
			return;

		var pluginName = 'print';

		// Register the command.
		editor.addCommand( pluginName, CKEDITOR.plugins.print );

		// Register the toolbar button.
		editor.ui.addButton && editor.ui.addButton( 'Print', {
			label: editor.lang.print.toolbar,
			command: pluginName,
			toolbar: 'document,50'
		} );
	}
} );

CKEDITOR.plugins.print = {
	exec: function( editor ) {
		if ( CKEDITOR.env.gecko ) {
			editor.window.$.print();
		} else {
			editor.document.$.execCommand( 'Print' );
		}
	},
	canUndo: false,
	readOnly: 1,
	modes: { wysiwyg: 1 }
};
