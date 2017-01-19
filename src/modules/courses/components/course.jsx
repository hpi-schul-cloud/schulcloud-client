import LayoutBase from '../../base/containers/layout';

import SectionTitle from '../../base/components/title';
import SectionTools from './tools';
import SectionStudents from './students';
import SectionTeachers from './teachers';

require('../styles/course.scss');

class Course extends React.Component {

	constructor(props) {
		super(props);
	}

	getSubTitleUI() {
		return this.props.course.classId ? `für Klasse ${this.props.course.classId.name}` : '';
	}

	render() {
		return (
			<LayoutBase className="route-course">
				<SectionTitle title={this.props.course.name} subtitle={this.getSubTitleUI()} />
				<div className="course-section">
					<div className="container-fluid">
						<SectionTeachers course={this.props.course}/>
						<div className="row">
							<SectionTools {... this.props} />
							<SectionStudents course={this.props.course} />
						</div>
					</div>
				</div>
			</LayoutBase>
		);
	}

}

export default Course;
