import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import imageIcon from '@ckeditor/ckeditor5-core/theme/icons/image.svg';

const bootbox = require('bootbox');

class FileBrowserPlugin extends Plugin {
	init() {
		const { editor } = this;
		editor.ui.componentFactory.add('insertImage', (locale) => {
			const view = new ButtonView(locale);

			view.set({
				label: 'Insert image',
				icon: imageIcon,
				tooltip: true,
			});

			// Callback executed once the image is clicked.
			view.on('execute', async () => {

				const dialog = bootbox.dialog({
					title: 'Image Properties',
					message: '<label for="ffile">Image URL: </label><br><input type="text" id="ffile"><button type="button" id="browseServerButton">Browse Server</button><br><label for="falttext">Alternative Text: </label><br><input type="text" id="falttext">',
					closeButton: false,
					buttons: {
						cancel: {
							label: 'Cancel',
						},
						ok: {
							label: 'OK',
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
						const dialogPageUrl = '/files/my?CKEditor=evaluation';
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
