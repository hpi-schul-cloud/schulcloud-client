import {
	ReactSelect
} from '../../core/helpers/form';

class SystemSelector extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			showSelectors: false,
			schools: [],
			systems: []
		};
	}

	showSchoolSystemSelectors() {
		this.setState({showSelectors: true});
		this.loadSchools();
	}

	loadSchools() {
		this.props.actions.loadSchools()
			.then(schools => this.setState({schools}))
			.catch(e => console.error(e));
	}

	loadSystems(schoolId) {
		if(!schoolId) {
			this.setState({systems: []});
			return;
		}

		const selectedSchool = this.state.schools[schoolId];
		this.props.actions.loadSystems(selectedSchool)
			.then(systems => this.setState({systems}))
			.catch(e => console.error(e));
	}

	getSchoolsUI() {
		let schools = Object.values(this.state.schools) || [];
		if(!schools.length) return;

		schools = schools.map(school => ({
			label: school.name,
			value: school._id
		}));

		return (
			<ReactSelect
				name="schoolId"
				placeholder="Schule"
				type="text"
				layout="elementOnly"
				options={schools}
				value=""
				className="select"
				onChange={this.loadSystems.bind(this)}
				required
			/>
		);
	}

	getSystemsUI() {
		let systems = Object.values(this.state.systems) || [];
		if(!systems.length) return;

		systems = systems.map(system => ({
			label: system.type,
			value: system._id
		}));

		let selectedSystem;
		if (systems.length == 1) {
			selectedSystem = systems[0].value;
		}

		return (
			<ReactSelect
				name="systemId"
				type="text"
				placeholder="System"
				layout="elementOnly"
				options={systems}
				value={selectedSystem}
				className="select"
				required
				disabled={!!selectedSystem}
			/>
		);
	}

	render() {
		if(this.state.showSelectors) {
			return (
				<div>
					{this.getSchoolsUI()}
					{this.getSystemsUI()}
				</div>
			);
		} else {
			return (
				<button
					type="button"
					className="btn btn-secondary btn-block"
					onClick={this.showSchoolSystemSelectors.bind(this)}
				>
					Mit anderem System anmelden
				</button>
			)
		}
	}

}

export default SystemSelector;
