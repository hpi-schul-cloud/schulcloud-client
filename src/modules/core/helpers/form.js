import Formsy from 'formsy-react';

import {Checkbox, CheckboxGroup, ComponentMixin, ParentContextMixin, Icon, Input, RadioGroup, Row, Select, File, Textarea} from 'formsy-react-components';
import ReactSelectPlain from 'react-select';

const ReactSelect = React.createClass({

	mixins: [Formsy.Mixin, ComponentMixin],

	propTypes: {
		name: React.PropTypes.string.isRequired,
		placeholder: React.PropTypes.string,
		multiple: React.PropTypes.bool,
		options: React.PropTypes.array.isRequired
	},

	changeValue(value, selectedOptions) {
		if (this.props.multiple) {
			this.setValue(selectedOptions.map(option => option.value));
		} else {
			this.setValue(value);
		}
		this.props.onChange(this.props.name, value);
	},

	render() {
		if (this.getLayout() === 'elementOnly') {
			return this.renderElement();
		}

		return (
			<Row
				{...this.getRowProperties()}
				htmlFor={this.getId()}
			>
				{this.renderElement()}
				{this.renderHelp()}
				{this.renderErrorMessage()}
			</Row>
		);
	},

	renderElement() {
		return (
			<ReactSelectPlain
				//{...this.props}
				ref={(c) => this.element = c}
				onChange={this.changeValue}
				value={this.getValue()}
				id={this.getId()}
				disabled={this.isFormDisabled() || this.props.disabled}
				options={this.props.options}
			/>
		)
	}
});

export {
	Checkbox,
	CheckboxGroup,
	ComponentMixin,
	ParentContextMixin,
	Icon,
	Input,
	RadioGroup,
	Row,
	Select,
	File,
	Textarea
} from 'formsy-react-components';

const Form = Formsy.Form;
export {
	Form,
	ReactSelect
};

