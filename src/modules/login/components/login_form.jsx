import { Notification } from '../../core/helpers';

class LoginForm extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			email: '',
			password: ''
		}
	}

	componentDidMount() {
		if(this.props.reference) {
			switch(this.props.reference) {
				case 'signup': {
					Notification.showInfo('Super, wir haben eine E-Mail mit Ihren Nutzerdaten an die angegebene E-Mail-Adresse versendet.');
				};
			};
		}
	}

	handleFieldChange(key, event) {
		let newState = this.state || {};
		newState[key] = event.target.value;

		this.setState(newState);
	}

	handleLogin(e) {
		this.props.onLogin({
			email: this.state.email,
			password: this.state.password,
			schoolId: this.state.schoolId || undefined,
			systemId: this.state.systemId || undefined,
		});
	}

	loadSystems(event) {
		this.setState({schoolId: event.target.value});

		const schoolId = event.target.value;
		const systems = this.props.schools[schoolId].systems;
		this.setState({systems: systems});

		if(systems.length) {
			// automatically select the first system
			this.setState({systemId: systems[0]._id});
		}
	}

	getSchoolsUI() {
		if(!this.props.schools) return '';

		return (
			<select className="custom-select form-control" onChange={this.loadSystems.bind(this)}>
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
		if(!this.state.systems) return '';
		const systems = this.state.systems || [];
		if (systems.length == 1) {
			const system = systems[0];
			return (
				<select className="custom-select form-control" value={system._id} readOnly="readOnly">
					<optgroup label="System">
						<option key={system._id} value={system._id} className="system-option">{system.type}</option>
					</optgroup>
				</select>
			);
		} else {
			return (
				<select className="custom-select form-control system-select" onChange={this.handleFieldChange.bind(this, 'systemId')}>
					<optgroup label="System">
						<option hidden>System auswählen</option>
						{systems.map((system) => {
							return (<option key={system._id} value={system._id}>{system.type}</option>);
						})}
					</optgroup>
				</select>
			);
		}
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
