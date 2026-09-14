import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import MathEditing from './mathediting';
import MathUI from './mathui';

export default class Math extends Plugin {
	static get requires() {
		return [MathEditing, MathUI];
	}

	static get pluginName() {
		return 'Math';
	}
}
