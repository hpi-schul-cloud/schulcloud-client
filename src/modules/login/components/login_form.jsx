import React from 'react';

class LoginForm extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			email: '',
			password: ''
		}
	}

	handleFieldChange(key, event) {
		let newState = this.state || {};
		newState[key] = event.target.value;

		this.setState(newState);
	}

	handleLogin(e) {
		this.props.actions.login.bind(this)({
			email: this.state.email,
			password: this.state.password,
			school: this.state.school || undefined,
			system: this.state.system || undefined,
		});
	}

	getSchoolsUI() {
		if(!this.props.schools) return '';

		return (
			<select className="custom-select" onChange={this.handleFieldChange.bind(this, 'school')}>
				<optgroup label="Schule">
					<option hidden>Schule auswählen</option>
					{Object.values(this.props.schools).map((school) => {
						return (<option key={school._id} value={school._id}>{school.name}</option>);
					})}
				</optgroup>
			</select>
		);
	}

	getSystemsUI() {
		if(!this.props.schools || ((this.props.schools[this.state.school] || {}).systems || []).length < 2) return '';

		return (
			<select className="custom-select" onChange={this.handleFieldChange.bind(this, 'system')}>
				<optgroup label="System">
					<option hidden>System auswählen</option>
					{((this.props.schools[this.state.school] || {}).systems || []).map((system) => {
						return (<option key={system._id} value={system._id}>{system.name}</option>);
					})}
				</optgroup>
			</select>
		);
	}

	render() {
		return (
			<div className="form-group">
				<input type="text" className="form-control form-control-lg" placeholder="Email" onChange={this.handleFieldChange.bind(this, 'email')} />
				<input type="password" className="form-control form-control-lg" placeholder="Passwort" onChange={this.handleFieldChange.bind(this, 'password')} />
				{this.getSchoolsUI()}
				{this.getSystemsUI()}
				<button className="btn btn-primary" onClick={this.handleLogin.bind(this)}>Anmelden</button>
			</div>
		);
	}

}

export default LoginForm;
