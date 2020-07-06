import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import imageIcon from '@ckeditor/ckeditor5-core/theme/icons/image.svg';

import bootbox from 'bootbox';

export default class FileBrowserPlugin extends Plugin {
	init() {
		const { editor } = this;
		const { t } = editor;

		editor.ui.componentFactory.add('filebrowser', (locale) => {
			const view = new ButtonView(locale);

			view.set({
				label: t('Insert Image'),
				icon: imageIcon,
				tooltip: true,
			});

			view.on('execute', async () => {
				const dialog = bootbox.dialog({
					title: t('Image Properties'),
					message: `<label for="url-input">${t('URL')}:</label><br>
							  <input type="text" id="url-input">
							  <button type="button" id="browseServerButton">${t('Browse Server')}</button><br>
							  <label for="alt-text-input">${t('Alternative Text')}:</label><br>
							  <input type="text" id="alt-text-input">`,
					closeButton: false,
					buttons: {
						cancel: {
							label: t('Cancel'),
						},
						ok: {
							label: t('OK'),
							callback: () => {
								const imageUrl = document.getElementById('url-input').value;
								const imageAltText = document.getElementById('alt-text-input').value;
								editor.model.change((writer) => {
									const imageElement = writer.createElement('image', {
										src: imageUrl,
										alt: imageAltText,
									});

									editor.model.insertContent(imageElement, editor.model.document.selection);
								});
							},
						},
					},
				});

				dialog.on('shown.bs.modal', () => {
					document.getElementById('browseServerButton').addEventListener('click', () => {
						const dialogPageUrl = editor.config.get('filebrowser.browseUrl');
						const dialogWindow = window.open(dialogPageUrl, '_blank', 'width=700, height=500');
						dialogWindow.onload = () => {
							dialogWindow.callbackFunctionFileUrl = (imageUrl) => {
								document.getElementById('url-input').value = imageUrl;
							};
						};
					});
				});
			});

			return view;
		});
	}
}
