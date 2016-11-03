import React from 'react';

require('../styles/timetable.scss');

class SectionTimetable extends React.Component {

	constructor(props) {
		super(props);
	}

	getCardsUI() {
		return (
			<div>
				<div className="col-sm-2 lesson-card">
					<div className="card card-block">
						<time className="lesson-time">1. + 2. Stunde</time>
						<h3 className="card-title">Mathematik<br />R 123</h3>
						<p className="card-text">Bla bla</p>
					</div>
				</div>
				<div className="col-sm-2 lesson-card">
					<div className="card card-block">
						<time className="lesson-time">3. + 4. Stunde</time>
						<h3 className="card-title">Mathematik<br />R 123</h3>
					</div>
				</div>
				<div className="col-sm-2 lesson-card">
					<div className="card card-block">
						<time className="lesson-time">5. + 6. Stunde</time>
						<h3 className="card-title">Mathematik<br />R 123</h3>
						<p className="card-text">Bla bla</p>
					</div>
				</div>
				<div className="col-sm-2 lesson-card">
					<div className="card card-block disabled" data-status="fällt aus">
						<time className="lesson-time">7. + 8. Stunde</time>
						<h3 className="card-title">Mathematik<br />R 123</h3>
						<p className="card-text">Bla bla</p>
					</div>
				</div>

			</div>
		);
	}

	getControlsUI() {
		return (
			<div className="controls">
				<time className="selected-date">Dienstag, 7. Dezember 2016</time>
				<div className="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
					<div className="btn-group" role="group" aria-label="First group">
						<button type="button" className="btn btn-secondary btn-sm active">Tag</button>
						<button type="button" className="btn btn-secondary btn-sm">Woche</button>
					</div>
					<div className="btn-group" role="group" aria-label="Second group">
						<button type="button" className="btn btn-secondary btn-sm"><i className="fa fa-chevron-left" /></button>
						<button type="button" className="btn btn-secondary btn-sm">Heute</button>
						<button type="button" className="btn btn-secondary btn-sm"><i className="fa fa-chevron-right" /></button>
					</div>
				</div>
			</div>
		);
	}

	getTimelineUI() {
		return (
			<div>
				{[8,9,10,11,12,13,14,15,16,17,18,19].map((time) => {
					return (
						<div className="col-sm-1" key={time}>
							<div className="tick">{time}.00</div>
						</div>
					);
				})}
			</div>
		);
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
					<div className="row lesson-cards">
						{this.getCardsUI.bind(this)()}
					</div>
					<div className="row timeline">
						{this.getTimelineUI.bind(this)()}
					</div>
				</div>
			</section>
		);
	}

}

export default SectionTimetable;
