class SystemSelector extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			showSchoolsAndSystems: false,
		};
	}

	handleSystemSelection(systemId) {
		this.props.onChange(systemId);	// notify the parent of relevant changes (whether the user did select a valid system)
	}

	showSchoolSystemSelectors() {
		this.setState({showSchoolsAndSystems: true});
		this.handleSystemSelection(null);
		this.props.actions.loadSchools()
			.then(schools => this.setState({schools}))
			.catch(e => console.log(e));
	}

	didSelectSchool(event) {
		const schoolId = event.target.value;
		if(!schoolId) return;
		this.handleSystemSelection(null);	// if the school was just selected, there can be no system chosen
		this.setState({
			schoolId: schoolId,
			systems: []		// pending reload
		});

		const school = this.state.schools[schoolId];

		this.loadSystems(school);
	}

	loadSystems(school) {
		this.props.actions.loadSystems(school)
			.then(systems => {
				let state = {systems};
				if (systems.length === 1) {
					state['systemId'] = systems[0];	// automatically select the only system
					this.handleSystemSelection(systems[0]._id);
				}
				this.setState(state);
			})
			.catch(e => console.log(e));
	}

	didSelectSystem(event) {
		let systemId = event.target.value;
		this.setState({systemId});
		this.handleSystemSelection(systemId);
	}

	getSchoolsUI() {
		if(!this.state.schools) return null;

		return (
			<select className="custom-select form-control" onChange={this.didSelectSchool.bind(this)} key="schoolSelector">
				<optgroup label="Schule">
					<option hidden>Schule auswählen</option>
					{Object.values(this.state.schools).map((school) => {
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
				<select className="custom-select form-control" value={system._id} readOnly="readOnly" key="systemSelectorStatic">
					<optgroup label="System">
						<option key={system._id} value={system._id} className="system-option">{system.type}</option>
					</optgroup>
				</select>
			);
		}
		if (systems.length < 2) return null;
		return (
			<select className="custom-select form-control system-select" onChange={this.didSelectSystem.bind(this)} key="systemSelector">
				<optgroup label="System">
					<option hidden>System auswählen</option>
					{systems.map((system) => {
						return (<option key={system._id} value={system._id}>{system.type}</option>);
					})}
				</optgroup>
			</select>
		);
	}

	showSelectors() {
		if(this.state.showSchoolsAndSystems) {
			return [
				this.getSchoolsUI(),
				this.getSystemsUI()
			];
		}
	}

	render() {
		return (
			<div className="form-group">
				{this.showSelectors()}
				{ (this.state.showSchoolsAndSystems) ? null : <button className="btn btn-secondary btn-block" onClick={this.showSchoolSystemSelectors.bind(this)}>Mit anderem System anmelden</button> }
			</div>
		);
	}

}

export default SystemSelector;
