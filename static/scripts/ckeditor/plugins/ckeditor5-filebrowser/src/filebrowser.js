import $ from 'jquery';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import imageIcon from '@ckeditor/ckeditor5-core/theme/icons/image.svg';

import audioIcon from '../theme/icons/audio.svg';
import videoIcon from '../theme/icons/video.svg';
import ImageBrowserCommand from './image-browser-command';
import VideoBrowserCommand from './video-browser-command';
import AudioBrowserCommand from './audio-browser-command';

export default class FileBrowserPlugin extends Plugin {
	init() {
		const { editor } = this;
		const { t } = editor;
		const { schema } = editor.model;
		const { conversion } = editor;

		schema.register('video', {
			allowWhere: '$block',
			isBlock: true,
			isObject: true,
			isLimit: true,
			allowAttributes: ['source', 'controls', 'controlslist'],
		});
		conversion.elementToElement({ view: 'video', model: 'video' });

		schema.register('audio', {
			allowWhere: '$block',
			isBlock: true,
			isObject: true,
			isLimit: true,
			allowAttributes: ['source', 'controls', 'controlslist'],
		});
		conversion.elementToElement({ view: 'audio', model: 'audio' });

		conversion.attributeToAttribute({ view: 'src', model: 'source' });
		conversion.attributeToAttribute({ view: 'controls', model: 'controls' });
		conversion.attributeToAttribute({ view: 'controlslist', model: 'controlslist' });

		editor.ui.componentFactory.add('imagebrowser', (locale) => {
			const view = new ButtonView(locale);

			editor.commands.add('imagebrowser', new ImageBrowserCommand(editor));

			view.set({
				label: t('Insert Image'),
				icon: imageIcon,
				tooltip: true,
				command: 'imagebrowser',
			});

			const command = editor.commands.get('imagebrowser');
			view.bind('isEnabled').to(command, 'isEnabled');

			this.listenTo(view, 'execute', () => editor.execute('imagebrowser'));

			return view;
		});

		editor.ui.componentFactory.add('videobrowser', (locale) => {
			const view = new ButtonView(locale);

			editor.commands.add('videobrowser', new VideoBrowserCommand(editor));

			view.set({
				label: t('Insert Video'),
				icon: videoIcon,
				tooltip: true,
				command: 'videobrowser',
			});

			const command = editor.commands.get('videobrowser');
			view.bind('isEnabled').to(command, 'isEnabled');

			this.listenTo(view, 'execute', () => editor.execute('videobrowser'));

			return view;
		});

		editor.ui.componentFactory.add('audiobrowser', (locale) => {
			const view = new ButtonView(locale);

			editor.commands.add('audiobrowser', new AudioBrowserCommand(editor));

			view.set({
				label: t('Insert Audio'),
				icon: audioIcon,
				tooltip: true,
				command: 'audiobrowser',
			});

			const command = editor.commands.get('audiobrowser');
			view.bind('isEnabled').to(command, 'isEnabled');

			this.listenTo(view, 'execute', () => editor.execute('audiobrowser'));

			return view;
		});
	}
}
