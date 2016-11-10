require('../styles/controls.scss');

class SectionControls extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	getControlsUI() {
		if ( this.props.dashboard ){
			return (
				<div className="controls">
					<time className="selected-date">Donnerstag, 17. November 2016</time>
					<div className="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
						<div className="btn-group" role="group" aria-label="First group">
							<button type="button" className="btn btn-secondary btn-sm active">Tag</button>
							<button type="button" className="btn btn-secondary btn-sm">Woche</button>
						</div>
						<div className="btn-group" role="group" aria-label="Second group">
							<button type="button" className="btn btn-secondary btn-sm"><i className="fa fa-chevron-left"/></button>
							<button type="button" className="btn btn-secondary btn-sm">Heute</button>
							<button type="button" className="btn btn-secondary btn-sm"><i className="fa fa-chevron-right"/></button>
						</div>
					</div>
				</div>
			);
		} else {
		return (
			<div className="controls">
				<time className="selected-date"></time>
				<div className="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
					<div className="btn-group" role="group" aria-label="First group">
						<button type="button" className="btn btn-secondary btn-sm active">Woche</button>
						<button type="button" className="btn btn-secondary btn-sm">Monat</button>
					</div>
					<div className="btn-group" role="group" aria-label="Second group">
						<button type="button" className="btn btn-secondary btn-sm"><i className="fa fa-chevron-left"/></button>
						<button type="button" className="btn btn-secondary btn-sm">Woche</button>
						<button type="button" className="btn btn-secondary btn-sm"><i className="fa fa-chevron-right"/></button>
					</div>
				</div>
			</div>
		);
	}
	}

	render() {
		return (
      <section className="section-timetable">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-4 no-padding">
							<h5>Stundenplan</h5>
						</div>
						<div className="col-sm-8 no-padding">
							{this.getControlsUI.bind(this)()}
						</div>
					</div>
				</div>
			</section>
		);
	}
}

export default SectionControls;
