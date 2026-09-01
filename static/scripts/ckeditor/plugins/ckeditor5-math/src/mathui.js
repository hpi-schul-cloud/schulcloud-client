import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';
import clickOutsideHandler from '@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler';

import MathFormView from './ui/mathformview';
import mathIcon from '../theme/icons/math.svg';

export default class MathUI extends Plugin {
	static get requires() {
		return [ContextualBalloon];
	}

	static get pluginName() {
		return 'MathUI';
	}

	init() {
		const { editor } = this;

		this.balloon = editor.plugins.get(ContextualBalloon);
		this.formView = this.createFormView();

		editor.ui.componentFactory.add('math', (locale) => {
			const view = new ButtonView(locale);
			const command = editor.commands.get('math');

			view.set({
				label: editor.t('Insert Math'),
				icon: mathIcon,
				tooltip: true,
			});

			view.bind('isEnabled').to(command, 'isEnabled');
			this.listenTo(view, 'execute', () => this.showUI());

			return view;
		});
	}

	destroy() {
		super.destroy();
		this.formView.destroy();
	}

	createFormView() {
		const { editor } = this;
		const formView = new MathFormView(editor.locale);

		formView.on('submit', () => {
			const { equation } = formView;

			if (equation) {
				editor.execute('math', equation, formView.displayMode);
			}

			this.hideUI();
		});

		formView.on('cancel', () => this.hideUI());

		clickOutsideHandler({
			emitter: formView,
			activator: () => this.isVisible,
			contextElements: [this.balloon.view.element],
			callback: () => this.hideUI(),
		});

		return formView;
	}

	get isVisible() {
		return this.balloon.visibleView === this.formView;
	}

	showUI() {
		if (this.isVisible) {
			return;
		}

		const { editor } = this;
		const command = editor.commands.get('math');

		this.balloon.add({
			view: this.formView,
			position: this.getBalloonPositionData(),
		});

		this.formView.displayMode = command.value ? command.value.display : false;
		this.formView.equation = command.value ? command.value.equation : '';
		this.formView.focus();
	}

	hideUI() {
		if (!this.balloon.hasView(this.formView)) {
			return;
		}

		this.balloon.remove(this.formView);
		this.editor.editing.view.focus();
	}

	getBalloonPositionData() {
		const { view } = this.editor.editing;

		return {
			target: () => view.domConverter.viewRangeToDom(view.document.selection.getFirstRange()),
		};
	}
}
