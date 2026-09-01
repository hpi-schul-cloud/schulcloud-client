import View from '@ckeditor/ckeditor5-ui/src/view';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import SwitchButtonView from '@ckeditor/ckeditor5-ui/src/button/switchbuttonview';
import LabeledFieldView from '@ckeditor/ckeditor5-ui/src/labeledfield/labeledfieldview';
import { createLabeledInputText } from '@ckeditor/ckeditor5-ui/src/labeledfield/utils';
import submitHandler from '@ckeditor/ckeditor5-ui/src/bindings/submithandler';
import checkIcon from '@ckeditor/ckeditor5-core/theme/icons/check.svg';
import cancelIcon from '@ckeditor/ckeditor5-core/theme/icons/cancel.svg';

import { renderEquation } from '../utils';

export default class MathFormView extends View {
	constructor(locale) {
		super(locale);

		const { t } = locale;

		this.set('displayMode', false);

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
				this.saveButtonView,
				this.cancelButtonView,
			],
		});
	}

	render() {
		super.render();

		submitHandler({ view: this });
		this.equationInputView.fieldView.element.addEventListener('input', () => this.updatePreview());

		this.element.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				this.fire('cancel');
				event.stopPropagation();
			}
		});
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

		if (!element) {
			return;
		}

		const { equation } = this;

		if (!equation) {
			element.textContent = '';
			return;
		}

		renderEquation(equation, element, this.displayMode);
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
