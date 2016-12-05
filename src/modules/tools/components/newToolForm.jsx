import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';

require('../styles/newToolForm.scss');

class NewToolForm extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			tool: {
				lti_message_type: 'basic-lti-launch-request',
				lti_version: 'LTI-1p0',
				resource_link_id: '0',
				privacy_permission: 'anonymous',
				customs: []
			},
			custom_fields: [],
			new_custom_field: {
				key: '',
				value: ''
			}
		};

		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleChange(fieldName, event) {
		var stateUpdate = this.state.tool;
		stateUpdate[fieldName] = event.target.value;
		this.setState({tool: stateUpdate});
	}

	handleSubmit(event) {
		event.preventDefault();
		var tool = this.state.tool;
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

		var index = newCustomField.key + newCustomField.value + Math.random() * 10000;
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

	renderNewCustomFields() {
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

	render() {
		return (
			<form className="new_tool_form">
				<label>
					Name (Pflichtfeld):
					<input type="text" required="required" value={this.state.tool.name} onChange={this.handleChange.bind(null, "name")} />
				</label> <br></br>
				<label>
					URL (Pflichtfeld):
					<input type="text" required="required" value={this.state.tool.url} onChange={this.handleChange.bind(null, "url")} />
				</label> <br></br>
				<label>
					OAuth-Key (Pflichtfeld):
					<input type="text" required="required" value={this.state.tool.key} onChange={this.handleChange.bind(null, "key")} />
				</label> <br></br>
				<label>
					OAuth-Secret (Pflichtfeld):
					<input type="text" required="required" value={this.state.tool.secret} onChange={this.handleChange.bind(null, "secret")} />
				</label> <br></br>
				<label>
					Logo (URL):
					<input type="text" value={this.state.tool.logo_url} onChange={this.handleChange.bind(null, "logo_url")} />
				</label> <br></br>
				<label>
					Privatsphäre:
					<select className="form-control" required="required" value={this.state.tool.privacy_permission} onChange={this.handleChange.bind(null, "privacy_permission" +
					 "")}>
						<option value="anonymous">Anonym</option>
						<option value="e-mail">Nur E-Mail</option>
						<option value="name">Nur Name</option>
						<option value="public">Öffentlich</option>
					</select>
				</label> <br></br>
				<div className="custom-fields">
					Sonstige Einstellungen:
					{ this.renderCustomFields() } <br></br>
					{ this.renderNewCustomFields() } <br></br>
				</div>
				<button data-dismiss="modal" onClick={this.handleSubmit} className="btn btn-primary">Abschicken</button>
			</form>
		);
	}

}

export default NewToolForm;
