import $ from 'jquery';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import imageIcon from '@ckeditor/ckeditor5-core/theme/icons/image.svg';

import audioIcon from '../theme/icons/audio.svg';
import videoIcon from '../theme/icons/video.svg';
import ImageBrowserCommand from './imagebrowsercommand';

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

			const command = editor.commands.get('imagebrowser');

			view.set({
				label: t('Insert Image'),
				icon: imageIcon,
				tooltip: true,
				command: 'imagebrowser',
			});

			view.bind('isEnabled').to(command, 'isEnabled');

			this.listenTo(view, 'execute', () => editor.execute('imagebrowser'));

			return view;
		});

		editor.ui.componentFactory.add('videobrowser', (locale) => {
			const view = new ButtonView(locale);

			view.set({
				label: t('Insert Video'),
				icon: videoIcon,
				tooltip: true,
			});

			view.on('execute', async () => {
				const dialogTitle = t('Video Properties');
				const onCreate = () => {
					const videoUrl = document.getElementById('url-input').value;
					if (!videoUrl) return;
					editor.model.change((writer) => {
						const videoElement = writer.createElement('video', {
							source: videoUrl,
							controls: 'true',
							controlslist: 'nodownload',
						});
						const lastOpenedEditorId = document.getElementById('editor-id').value;
						if (lastOpenedEditorId === editor.id) {
							editor.model.insertContent(videoElement, editor.model.document.selection);
						}
					});
				};
				createFilebrowserModal(editor, t, dialogTitle, onCreate);
			});

			return view;
		});

		editor.ui.componentFactory.add('audiobrowser', (locale) => {
			const view = new ButtonView(locale);

			view.set({
				label: t('Insert Audio'),
				icon: audioIcon,
				tooltip: true,
			});

			view.on('execute', async () => {
				const dialogTitle = t('Audio Properties');
				const onCreate = () => {
					const audioUrl = document.getElementById('url-input').value;
					if (!audioUrl) return;
					editor.model.change((writer) => {
						const audioElement = writer.createElement('audio', {
							source: audioUrl,
							controls: 'true',
							controlslist: 'nodownload',
						});
						const lastOpenedEditorId = document.getElementById('editor-id').value;
						if (lastOpenedEditorId === editor.id) {
							editor.model.insertContent(audioElement, editor.model.document.selection);
						}
					});
				};
				createFilebrowserModal(editor, t, dialogTitle, onCreate);
			});

			return view;
		});
	}
}