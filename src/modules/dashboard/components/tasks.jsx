require('../styles/tasks.scss');

class SectionTasks extends React.Component {

	constructor(props) {
		super(props);
	}

	getTasksUI() {
		return (
			<div>
				<div className="col-sm-6">
					<div className="form-check">
						<label className="form-check-label">
							<input className="form-check-input" type="checkbox" value="" /> Hausaufgaben Mathe <span className="tag tag-warning">morgen fällig</span>
						</label>
					</div>
					<div className="form-check">
						<label className="form-check-label">
							<input className="form-check-input" type="checkbox" value="" /> Referat Bio <span className="tag tag-warning">morgen fällig</span>
						</label>
					</div>
				</div>
				<div className="col-sm-6">
					<div className="form-check">
						<label className="form-check-label">
							<input className="form-check-input" type="checkbox" value="" /> Hausaufgaben Geschichte <span className="tag tag-default">fällig in zwei Tagen</span>
						</label>
					</div>
					<div className="form-check">
						<label className="form-check-label">
							<input className="form-check-input" type="checkbox" value="" /> Hausaufgaben Englisch <span className="tag tag-default">fällig in zwei Tagen</span>
						</label>
					</div>
				</div>
			</div>
		);
	}

	render() {
		if(this.props.location == 'school') return false;

		return (
			<section className="section-tasks">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Aufgaben</h5>
						</div>
					</div>
					<div className="row taks">
						<div className="row">
							{this.getTasksUI.bind(this)()}
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default SectionTasks;
