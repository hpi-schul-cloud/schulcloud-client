import Command from '@ckeditor/ckeditor5-core/src/command';
import { getSelectedMathWidget } from './utils';

export default class MathCommand extends Command {
	refresh() {
		const { model } = this.editor;
		const { selection } = model.document;
		const selectedElement = getSelectedMathWidget(selection);

		this.value = selectedElement
			? {
				equation: selectedElement.getAttribute('equation'),
				display: !!selectedElement.getAttribute('display'),
			}
			: null;

		this.isEnabled = !!selectedElement
			|| model.schema.checkChild(selection.getFirstPosition().parent, 'mathtex-inline');
	}

	execute(equation, display) {
		const { model } = this.editor;
		const selectedElement = getSelectedMathWidget(model.document.selection);

		model.change((writer) => {
			const element = writer.createElement(
				display ? 'mathtex-display' : 'mathtex-inline',
				{ equation, display },
			);

			if (selectedElement) {
				model.insertContent(element, writer.createSelection(selectedElement, 'on'));
			} else {
				model.insertContent(element);
			}

			writer.setSelection(element, 'on');
		});
	}
}
