require('../styles/courseCard.scss');
import { Link } from 'react-router';

class CourseCard extends React.Component {


	constructor(props) {
		super(props);

		this.state = {};
	}

	render() {
		var course = this.props.course;
		return (
			<Link className="col-sm-4 course-card" to={`/courses/${course._id}`}>
				<div className="card">
					<div className="card-block">
						<h4 className="card-title">{course.name}</h4>
					</div>
				</div>
			</Link>
		);
	}
}

export default CourseCard;
