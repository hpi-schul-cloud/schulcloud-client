import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import infoIcon from '../theme/icons/info.svg';

export default class FileBrowserPlugin extends Plugin {
	init() {
		const { editor } = this;
		const { t } = editor;

		editor.ui.componentFactory.add('helplink', (locale) => {
			const view = new ButtonView(locale);

			view.set({
				label: t('Open Help Page'),
				icon: infoIcon,
				tooltip: true,
			});

			view.on('execute', async () => {
				window.open('/help/confluence/123409350');
			});

			return view;
		});
	}
}
