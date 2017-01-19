import SystemSelector from './systemSelector';

class LoginForm extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			username: '',
			password: ''
		};
	}

	handleFieldChange(key, event) {
		let newState = {};
		newState[key] = event.target.value;
		this.setState(newState);
	}

	handleValueChange(key, value) {
		let newState = {};
		newState[key] = value;
		this.setState(newState);
	}

	handleLogin(e) {
		this.props.onLogin({
			username: this.state.username,
			password: this.state.password,
			schoolId: this.state.schoolId || undefined,
			systemId: this.state.systemId || undefined,
		});
	}


	hasValidSystem() {
		// TODO: make work with local
		return true;
		//return this.state.systemId != null;
	}

	render() {
		return (
			<div className="form-group">
				<input type="text" className="form-control form-control-lg" placeholder="Email-Adresse oder Nutzername" onChange={this.handleFieldChange.bind(this, 'username')} />
				<input type="password" className="form-control form-control-lg" placeholder="Passwort" onChange={this.handleFieldChange.bind(this, 'password')} />
				<SystemSelector {...this.props}
								onChangeSchoolId={this.handleValueChange.bind(this, 'schoolId')}
								onChangeSystemId={this.handleValueChange.bind(this, 'systemId')} />
				<button className="btn btn-primary btn-block" disabled={!this.hasValidSystem()} onClick={this.handleLogin.bind(this)}>Anmelden</button>
			</div>
		);
	}

}

export default LoginForm;
