import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import imageIcon from '@ckeditor/ckeditor5-core/theme/icons/image.svg';

const bootbox = require('bootbox');

class FileBrowserPlugin extends Plugin {
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

			// Callback executed once the image is clicked.
			view.on('execute', async () => {
				const dialog = bootbox.dialog({
					title: t('Image Properties'),
					message: `<label for="ffile">${t('URL')}:</label><br>
							  <input type="text" id="ffile">
							  <button type="button" id="browseServerButton">${t('Browse Server')}</button><br>
							  <label for="falttext">${t('Alternative Text')}: </label><br>
							  <input type="text" id="falttext">`,
					closeButton: false,
					buttons: {
						cancel: {
							label: t('Cancel'),
						},
						ok: {
							label: t('OK'),
							callback: () => {
								const imageUrl = document.getElementById('ffile').value;
								const imageAltText = document.getElementById('falttext').value;
								editor.model.change((writer) => {
									const imageElement = writer.createElement('image', {
										src: imageUrl,
										alt: imageAltText,
									});

									// Insert the image in the current selection location.
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
								document.getElementById('ffile').value = imageUrl;
							};
						};
					});
				});
			});

			return view;
		});
	}
}

export default FileBrowserPlugin;
