require('../styles/school.scss');

import ModalForm from './modal-form';
import Table from './table';

class SectionCourses extends React.Component {

	constructor(props) {
		super(props);
		this.state = {};
	}

	editCourseUI(courseId = 0) {
		return (
			<div className="edit-form">
				<div className="form-group">
					<label htmlFor="">Name des Kurses *</label>
					<input type="text" className="form-control" placeholder="Mathe" name="name" required />
				</div>

				<input type="hidden" name="schoolId" value="582c58c72038900b2b7010a8" />

				<input type="hidden" name="classId" value="58407f3f8fd94f15f984ab03" />

				<div className="form-group">
					<label htmlFor="">Unterrichtender Lehrer</label>
					<select className="form-control" name="teacher" id="">
						<option>1</option>
						<option>2</option>
						<option>3</option>
						<option>4</option>
						<option>5</option>
					</select>
				</div>

				<div className="form-group">
					<label htmlFor="">Klasse(n)</label>
					<select multiple className="form-control" name="classId" id="">
						{this.props.classes.map((c) => {
							return (<option key={c._id} value={c._id}>{c.name}</option>);
						})}
					</select>
				</div>

				<div className="form-group">
					<label htmlFor="">Frequenz *</label>
					<input type="text" className="form-control" placeholder="Wöchentlich" name="frequency" required />
				</div>
			</div>
		);
	}

	modalUI() {
		const title = this.state.courseId ? "Kurs bearbeiten" : "Kurs hinzufügen";
		return (
			<ModalForm
				title={title}
				content={this.editCourseUI()}
				id="courseModal"
				courseId={this.state.courseId}
				submitCallback={(data) => {
					this.props.actions.addCourse(data);
				}}
			/>
		);
	}

	openModal(courseId) {
		this.setState({
			courseId
		});
		$('#courseModal').modal('show');
	}

	render() {
		const tableHead = ['ID', 'Name', 'Klasse', 'Erstellt am'];
		const tableBody = this.props.courses.map((c) => {
			return [c._id, c.name, c.classId, c.createdAt];
		});

		return (
			<section className="section-courses section-default">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Kurse</h5>

							<Table head={tableHead} body={tableBody} />
							<button type="submit" className="btn btn-primary" onClick={this.openModal.bind(this, '')}>
								Kurs hinzuf&uuml;gen
							</button>
						</div>
					</div>
				</div>

				{this.modalUI()}
			</section>
		);
	}

}

export default SectionCourses;
