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
					message: '<label for="ffile">Image URL: </label><input type="text" id="ffile">',
					size: 'large',
					buttons: {
						select: {
							label: 'Select Image from Server',
							className: 'btn-info',
							callback: () => {
								const dialogPageUrl = '/files/my?CKEditor=evaluation';
								const dialogWindow = window.open(dialogPageUrl, '_blank', 'width=700, height=500');
								dialogWindow.onload = () => {
									dialogWindow.callbackFunctionFileUrl = (imageUrl) => {
										document.getElementById('ffile').value = imageUrl;
									};
								};
								return false;
							},
						},
						insert: {
							label: 'Insert Image',
							className: 'btn-info',
							callback: () => {
								const imageUrl = document.getElementById('ffile').value;
								editor.model.change((writer) => {
									const imageElement = writer.createElement('image', {
										src: imageUrl,
									});

									// Insert the image in the current selection location.
									editor.model.insertContent(imageElement, editor.model.document.selection);
								});
							},
						},
					},
				});
			});

			return view;
		});
	}
}

export default FileBrowserPlugin;
