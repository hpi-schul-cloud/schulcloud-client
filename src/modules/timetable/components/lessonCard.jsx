import {Link} from 'react-router';

require('../styles/table.scss');

class LessonCard extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}


		render() {
			return (
					<Link className="col-sm-2 lesson-card" to="/lessons/s52ruf6wst">
						<div
              className={"card card-block " + (this.props.lesson.disabled ? 'disabled' : '')}
              data-status={(this.props.lesson.disabled ? 'fällt aus' : '')}>
							<time className="lesson-time">{ this.props.lesson.lessonTime }</time>
							<h3 className="card-title">{ this.props.lesson.title } <br /> { this.props.lesson.room }</h3>
							<p className="card-text">{ this.props.lesson.description }</p>
						</div>
					</Link>
			);
		}
}

export default LessonCard;
