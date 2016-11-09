import {Link} from 'react-router';

require('../styles/table.scss');

class SectionTable extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}


		getCardsUI() {
			return (
				<div>
					<h4>{ this.props.weekday }</h4>
					<Link className="col-sm-2 lesson-card" to="/lessons/s52ruf6wst">
						<div className="card card-block">
							<time className="lesson-time">1. + 2. Stunde</time>
							<h3 className="card-title">Mathematik<br />R 123</h3>
							<p className="card-text">description</p>
						</div>
					</Link>
					<Link className="col-sm-2 lesson-card" to="/lessons/s52ruf6wst">
						<div className="card card-block">
							<time className="lesson-time">3. + 4. Stunde</time>
							<h3 className="card-title">Mathematik<br />R 123</h3>
						</div>
					</Link>
					<Link className="col-sm-2 lesson-card" to="/lessons/s52ruf6wst">
						<div className="card card-block">
							<time className="lesson-time">5. + 6. Stunde</time>
							<h3 className="card-title">Mathematik<br />R 123</h3>
							<p className="card-text">description</p>
						</div>
					</Link>
					<Link className="col-sm-2 lesson-card" to="/lessons/s52ruf6wst">
						<div className="card card-block disabled" data-status="fällt aus">
							<time className="lesson-time">7. + 8. Stunde</time>
							<h3 className="card-title">Mathematik<br />R 123</h3>
							<p className="card-text">description</p>
						</div>
					</Link>

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
					<div className="container-fluid timetable">
						<div className="row lesson-cards">
							{this.getCardsUI.bind(this)()}
						</div>
						<div className="row timeline">
							{this.getTimelineUI.bind(this)()}
						</div>
					</div>
			);
		}
}

export default SectionTable;
