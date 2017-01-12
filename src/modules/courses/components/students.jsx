require('../styles/course.scss');

class SectionStudents extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			students: this.props.course.userIds
		};
	}

	getStudentUI(student) {
		// todo: profilpicture?
		return (
			<tr key={student._id}>
				<td><img className="picture" src="https://randomuser.me/api/portraits/men/53.jpg" alt=""/></td>
				<td>{student.firstName}</td>
				<td>{student.lastName}</td>
			</tr>
		);
	}

	render() {
		return (
			<div className="col-sm-6 no-padding course-subsection">
				<h5>Schüler</h5>
				<table>
					<thead>
					<tr>
						<th>Profilbild</th>
						<th>Vorname</th>
						<th>Nachname</th>
					</tr>
					</thead>
					<tbody>
					{
						this.state.students.map(student => {
							return this.getStudentUI(student);
						})
					}
					</tbody>
				</table>
				<ul>
				</ul>
			</div>
		);
	}

}

export default SectionStudents;
