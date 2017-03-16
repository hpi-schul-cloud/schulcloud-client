import {
	Input,
	Select,
	Form
} from '../../core/helpers/form';

require('../styles/newToolForm.scss');

class NewToolForm extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			tool: this.props.toolTemplate,
			custom_fields: this.props.toolTemplate.customs.map((c) => {
				c.id = this.createRandomComponentId(c.key, c.value);
				return c;
			}),
			new_custom_field: {
				key: '',
				value: ''
			}
		};

		// set default course
		this.state.tool.courseId = this.props.courses[0]._id;
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	createRandomComponentId(key, value) {
		return key + value + Math.random() * 10000;
	}

	handleSubmit(data) {
		var tool = this.state.tool;
		Object.keys(data).forEach(k => {
			tool[k] = data[k]
		});
		tool.customs = this.state.custom_fields;

		this.props.actions.createNew(tool);
	}

	handleChangeCustomField(fieldName, event) {
		var stateUpdate = this.state.new_custom_field;
		stateUpdate[fieldName] = event.target.value;
		this.setState({new_custom_field: stateUpdate});
	}

	handleAddCustomField(event) {
		var stateCustomsUpdate = this.state.custom_fields;
		var newCustomField = this.state.new_custom_field;

		// index for react component, not id of real db object
		var index = this.createRandomComponentId(newCustomField.key, newCustomField.value);
		stateCustomsUpdate.push({id: index, key: newCustomField.key, value: newCustomField.value});

		this.setState({custom_fields: stateCustomsUpdate});
		this.setState({new_custom_field: {key: '', value: ''}});
	}

	handleDeleteCustomField(id, event) {
		var stateCustomsUpdate = this.state.custom_fields.filter(c => {
			return c.id != id;
		});
		this.setState({custom_fields: stateCustomsUpdate});
	}

	renderNewCustomField() {
		return (
			<div>
				<input type="text" value={this.state.new_custom_field.key} onChange={this.handleChangeCustomField.bind(this, "key")} />
				<input type="text" value={this.state.new_custom_field.value} onChange={this.handleChangeCustomField.bind(this, "value")} />
				<i onClick={ this.handleAddCustomField.bind(this) } className="fa fa-plus" />
			</div>
		);
	}

	renderCustomFields() {
		return (
			<div>
				{
					this.state.custom_fields.map((c) => {
						return (
							<div key={ c.id }>
								Key: { c.key }, Value: { c.value } <i onClick={ this.handleDeleteCustomField.bind(this, c.id) } className="fa fa-trash-o" />
							</div>
						);
					})
				}
			</div>
		)
	}

	getCourseOptions() {
		return this.props.courses.map(c => {
			return {label: c.name, value: c._id};
		});
	}

	getPrivacyOptions() {
		return [
			{label: "Nur E-Mail", value: "e-mail"},
			{label: "Nur Name", value: "name"},
			{label: "Öffentlich", value: "public"}
		]
	}

	render() {
		return (
			<Form className="new_tool_form" onValidSubmit={this.handleSubmit.bind(this)}>
				<Select
					label="Kurs"
					name="courseId"
					type="text"
					options={this.getCourseOptions()}
					layout="vertical"
					value={this.state.tool.courseId}>
				</Select>
				<Input
					label="Name"
					type="text"
					name="name"
					layout="vertical"
					value={this.state.tool.name} />
				<Input
					label="Logo"
					type="text"
					name="logo_url"
					layout="vertical"
					value={this.state.tool.logo_url} />
				<Select
					label="Privatsphäre"
					name="privacy_permission"
					value={this.state.tool.privacy_permission}
					layout="vertical"
					options={this.getPrivacyOptions()}>
				</Select>
				<div className="custom-fields">
					Sonstige Einstellungen:
					{ this.renderCustomFields() } <br></br>
					{ this.renderNewCustomField() } <br></br>
				</div>
				<button
					type="submit"
					className="btn btn-primary">Abschicken</button>
			</Form>
		);
	}

}

export default NewToolForm;
