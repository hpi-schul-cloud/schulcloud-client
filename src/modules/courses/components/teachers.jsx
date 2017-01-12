require('../styles/course.scss');

class SectionTeachers extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			teachers: this.props.course.teacherIds
		};
	}

	getTeachersUI(teacher) {
		// todo: add "Herr" or "Frau"
		return (
			<span key={teacher._id} className="tag tag-default">{ teacher.lastName }</span>
		);
	}

	render() {
		return (
			<div className="course-subsection teachers">
				<b>Lehrer: { this.state.teachers.map(teacher => this.getTeachersUI(teacher)) }</b>
			</div>
		);
	}

}

export default SectionTeachers;
