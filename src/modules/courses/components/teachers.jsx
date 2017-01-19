require('../styles/course.scss');

class SectionTeachers extends React.Component {

	constructor(props) {
		super(props);
		this.teachers =  this.props.course.teacherIds;
	}

	render() {
		return (
			<div className="course-subsection teachers">
				<b>Lehrer: { this.teachers.map(teacher => teacher.lastName).join(", ") }</b>
			</div>
		);
	}

}

export default SectionTeachers;
