require('../styles/school.scss');

import ModalForm from './modal-form';
import Table from './table';

class SectionStudents extends React.Component {

	constructor(props) {
		super(props);
		this.state = {};
	}

	editClassUI(studentId = 0) {
		return (
			<div className="edit-form">
				<div className="form-group">
					<label htmlFor="">Name *</label>
					<input type="text" className="form-control" placeholder="Mathe" required />
				</div>

				<div className="form-group">
					<label htmlFor="">E-Mail *</label>
					<input type="email" className="form-control" placeholder="test@test.org" required />
				</div>
			</div>
		);
	}

	modalUI() {
		const title = this.state.studentId ? "Schüler bearbeiten" : "Schüler hinzufügen";
		return (
			<ModalForm
				title={title}
				content={this.editClassUI()}
				id="studentModal"
				studentId={this.state.studentId}
			/>
		);
	}

	openModal(studentId) {
		this.setState({
			studentId
		});
		$('#studentModal').modal('show');
	}

	render() {
		const tableHead = ['Name', 'Klasse', 'E-Mail-Adresse'];
		const tableBody = [
			['Max Mustermann', '11a', 'vorname.nachname@schulcloud.org'],
			['Max Mustermann', '11a', 'vorname.nachname@schulcloud.org'],
			['Max Mustermann', '11a', 'vorname.nachname@schulcloud.org']
		];

		return (
			<section className="section-courses section-default">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Schüler</h5>

							<Table head={tableHead} body={tableBody} />
							<button type="submit" className="btn btn-primary" onClick={this.openModal.bind(this, '')}>
								Schüler hinzuf&uuml;gen
							</button>
						</div>
					</div>
				</div>

				{this.modalUI()}
			</section>
		);
	}

}

export default SectionStudents;
