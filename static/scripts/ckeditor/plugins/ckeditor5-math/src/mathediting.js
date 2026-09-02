import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {
	Widget, toWidget, viewToModelPositionOutsideModelElement,
} from '@ckeditor/ckeditor5-widget/src/index';

import MathCommand from './mathcommand';
import { addDelimiters, extractDelimiters, renderEquation } from './utils';

const MODEL_INLINE = 'mathtex-inline';
const MODEL_DISPLAY = 'mathtex-display';

function createEditingView(modelItem, writer) {
	const equation = String(modelItem.getAttribute('equation'));
	const display = !!modelItem.getAttribute('display');

	const container = writer.createContainerElement(display ? 'div' : 'span', {
		class: `ck-math-tex ${display ? 'ck-math-tex-display' : 'ck-math-tex-inline'}`,
		style: display ? 'user-select: none;' : 'user-select: none; display: inline-block;',
	});

	const uiElement = writer.createUIElement('div', null, function render(domDocument) {
		const domElement = this.toDomElement(domDocument);
		renderEquation(equation, domElement, display);
		return domElement;
	});

	writer.insert(writer.createPositionAt(container, 0), uiElement);

	return container;
}

function createDataView(modelItem, { writer }) {
	const equation = String(modelItem.getAttribute('equation'));
	const display = !!modelItem.getAttribute('display');

	const container = writer.createContainerElement('span', { class: 'math-tex' });
	writer.insert(
		writer.createPositionAt(container, 0),
		writer.createText(addDelimiters(equation, display)),
	);

	return container;
}

export default class MathEditing extends Plugin {
	static get requires() {
		return [Widget];
	}

	static get pluginName() {
		return 'MathEditing';
	}

	init() {
		const { editor } = this;

		editor.commands.add('math', new MathCommand(editor));

		this.defineSchema();
		this.defineConverters();

		editor.editing.mapper.on(
			'viewToModelPosition',
			viewToModelPositionOutsideModelElement(
				editor.model,
				(viewElement) => viewElement.hasClass('ck-math-tex'),
			),
		);
	}

	defineSchema() {
		const { schema } = this.editor.model;

		schema.register(MODEL_INLINE, {
			allowWhere: '$text',
			isInline: true,
			isObject: true,
			allowAttributes: ['equation', 'display'],
		});

		schema.register(MODEL_DISPLAY, {
			allowWhere: '$block',
			isInline: false,
			isObject: true,
			allowAttributes: ['equation', 'display'],
		});
	}

	defineConverters() {
		const { conversion } = this.editor;

		conversion.for('upcast').elementToElement({
			view: { name: 'span', classes: ['math-tex'] },
			model: (viewElement, { writer }) => {
				const child = viewElement.getChild(0);

				if (!child || !child.is('$text')) {
					// eslint-disable-next-line no-console
					console.warn('[math] Skipped a .math-tex element without a text child.');
					return null;
				}

				const { equation, display } = extractDelimiters(child.data);

				return writer.createElement(
					display ? MODEL_DISPLAY : MODEL_INLINE,
					{ equation, display },
				);
			},
		});

		// Formulas authored between 2020-06-22 and 2020-07-14 were stored as <script
		// type="math/tex">. KaTeX auto-render ignores script tags, so they have never been
		// visible to students; they are dropped rather than migrated. Logged so that any
		// unexpected occurrence surfaces during testing instead of vanishing silently.
		conversion.for('upcast').elementToElement({
			view: { name: 'script', attributes: { type: /^math\/tex/ } },
			model: (viewElement) => {
				const child = viewElement.getChild(0);
				// eslint-disable-next-line no-console
				console.warn(
					'[math] Dropping unsupported legacy <script type="math/tex"> formula:',
					child && child.is('$text') ? child.data : '(empty)',
				);
				return null;
			},
		});

		conversion.for('editingDowncast')
			.elementToElement({
				model: MODEL_INLINE,
				view: (modelItem, { writer }) => toWidget(createEditingView(modelItem, writer), writer),
			})
			.elementToElement({
				model: MODEL_DISPLAY,
				view: (modelItem, { writer }) => toWidget(createEditingView(modelItem, writer), writer),
			});

		conversion.for('dataDowncast')
			.elementToElement({ model: MODEL_INLINE, view: createDataView })
			.elementToElement({ model: MODEL_DISPLAY, view: createDataView });
	}
}
