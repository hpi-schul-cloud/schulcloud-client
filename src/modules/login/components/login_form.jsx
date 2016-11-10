import { server } from '../../feathers';
const systemService = server.service('/systems');


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

	loadSystems(key, event) {
		// TODO: find out where to move this method
		this.setState({key: event.target.value});

		const schoolId = event.target.value;
		console.log('target is ' + event.target);
		const systemIds = this.props.schoolMap.get(schoolId).systems;

		Promise.all(systemIds.map(id => systemService.get(id)))
			.then(systems => {
				systems.forEach(s => {
					s.type = s.type.substr(0,1).toUpperCase() + s.type.substr(1);	// capitalize
				});
				if(systems.length < 2) {
					this.setState({system: systems[0]});	// automatically select the only system
				}
				this.setState({systems: systems});
			})
			.catch(error => {
				console.log(error);
			});
	}

	getSchoolsUI() {
		if(!this.props.schools) return '';

		return (
			<select className="custom-select form-control" onChange={this.loadSystems.bind(this, 'school')}>
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
		if (systems.length == 1 && this.state.system) {
			const system = this.state.system;
			return (
				<select className="custom-select form-control" value={system._id} readOnly="readOnly">
					<optgroup label="System">
						<option key={system._id} value={system._id} className="system-option">{system.type}</option>
					</optgroup>
				</select>
			);
		}
		if (systems.length < 2) return '';
		return (
			<select className="custom-select form-control system-select" onChange={this.handleFieldChange.bind(this, 'system')}>
				<optgroup label="System">
					<option hidden>System auswählen</option>
					{systems.map((system) => {
						console.log(system);
						return (<option key={system._id} value={system._id}>{system.type}</option>);
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
