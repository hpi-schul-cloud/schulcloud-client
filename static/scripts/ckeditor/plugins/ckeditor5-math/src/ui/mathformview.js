import View from '@ckeditor/ckeditor5-ui/src/view';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import SwitchButtonView from '@ckeditor/ckeditor5-ui/src/button/switchbuttonview';
import LabeledFieldView from '@ckeditor/ckeditor5-ui/src/labeledfield/labeledfieldview';
import { createLabeledInputText } from '@ckeditor/ckeditor5-ui/src/labeledfield/utils';
import submitHandler from '@ckeditor/ckeditor5-ui/src/bindings/submithandler';
import checkIcon from '@ckeditor/ckeditor5-core/theme/icons/check.svg';
import cancelIcon from '@ckeditor/ckeditor5-core/theme/icons/cancel.svg';

import { renderEquation } from '../utils';

import '../../theme/math.css';

export default class MathFormView extends View {
	constructor(locale) {
		super(locale);

		const { t } = locale;

		this.set('displayMode', false);
		this.previewRenderElement = null;

		this.equationInputView = new LabeledFieldView(locale, createLabeledInputText);
		this.equationInputView.label = t('TeX formula');

		this.displayButtonView = new SwitchButtonView(locale);
		this.displayButtonView.set({ label: t('Display mode'), withText: true });
		this.displayButtonView.bind('isOn').to(this, 'displayMode');
		this.displayButtonView.on('execute', () => {
			this.displayMode = !this.displayMode;
		});

		this.previewView = new View(locale);
		this.previewView.setTemplate({
			tag: 'div',
			attributes: { class: ['ck', 'ck-math-preview'] },
		});

		this.saveButtonView = this.createButton(t('Save'), checkIcon, 'ck-button-save');
		this.saveButtonView.type = 'submit';

		this.cancelButtonView = this.createButton(t('Cancel'), cancelIcon, 'ck-button-cancel');
		this.cancelButtonView.delegate('execute').to(this, 'cancel');

		this.actionsView = new View(locale);
		this.actionsView.setTemplate({
			tag: 'div',
			attributes: { class: ['ck', 'ck-math-form__actions'] },
			children: [this.saveButtonView, this.cancelButtonView],
		});

		this.on('change:displayMode', () => this.updatePreview());

		this.setTemplate({
			tag: 'form',
			attributes: {
				class: ['ck', 'ck-math-form'],
				tabindex: '-1',
			},
			children: [
				this.equationInputView,
				this.displayButtonView,
				this.previewView,
				this.actionsView,
			],
		});
	}

	render() {
		super.render();
		this.previewRenderElement = document.createElement('div');
		this.previewRenderElement.className = 'ck-math-preview__rendered';
		document.body.appendChild(this.previewRenderElement);

		submitHandler({ view: this });
		this.equationInputView.fieldView.element.addEventListener('input', () => this.updatePreview());

		this.element.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				this.fire('cancel');
				event.stopPropagation();
			}
		});
	}

	destroy() {
		this.previewRenderElement?.remove();
		super.destroy();
	}

	focus() {
		this.equationInputView.focus();
	}

	get equation() {
		return this.equationInputView.fieldView.element.value.trim();
	}

	set equation(value) {
		this.equationInputView.fieldView.value = value;

		if (this.equationInputView.fieldView.element) {
			this.equationInputView.fieldView.element.value = value;
		}

		this.updatePreview();
	}

	updatePreview() {
		const { element } = this.previewView;

		if (!element || !this.previewRenderElement) {
			return;
		}

		const { equation } = this;

		if (!equation) {
			this.previewRenderElement.textContent = '';
			this.previewRenderElement.style.display = 'none';
			element.style.height = '';
			return;
		}

		renderEquation(equation, this.previewRenderElement, this.displayMode);
		this.positionPreview();
	}

	positionPreview() {
		const { element } = this.previewView;

		if (!element || !this.previewRenderElement) {
			return;
		}

		const rect = element.getBoundingClientRect();
		Object.assign(this.previewRenderElement.style, {
			display: 'block',
			visibility: 'hidden',
			left: `${rect.left}px`,
			top: `${rect.top}px`,
			width: `${rect.width}px`,
			height: 'auto',
		});

		const height = Math.max(rect.height, this.previewRenderElement.scrollHeight);

		element.style.height = `${height}px`;
		Object.assign(this.previewRenderElement.style, {
			display: 'flex',
			visibility: 'visible',
			left: `${rect.left}px`,
			top: `${rect.top}px`,
			width: `${rect.width}px`,
			height: `${height}px`,
		});
	}

	createButton(label, icon, className) {
		const button = new ButtonView(this.locale);

		button.set({
			label,
			icon,
			tooltip: true,
			class: className,
		});

		return button;
	}
}
