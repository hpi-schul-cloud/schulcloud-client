require('../styles/school.scss');

import ModalForm from './modal-form';
import Table from './table';

class SectionTeachers extends React.Component {

	constructor(props) {
		super(props);
		this.state = {};
	}

	editClassUI(teacherId = 0) {
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
		const title = this.state.teacherId ? "Lehrer bearbeiten" : "Lehrer hinzufügen";
		return (
			<ModalForm
				title={title}
				content={this.editClassUI()}
				id="teacherModal"
				teacherId={this.state.teacherId}
			/>
		);
	}

	openModal(teacherId) {
		this.setState({
			teacherId
		});
		$('#teacherModal').modal('show');
	}

	render() {
		const tableHead = ['Name', 'E-Mail-Adresse'];
		const tableBody = [
			['Mathe', 'vorname.nachname@schulcloud.org'],
			['Deutsch', 'vorname.nachname@schulcloud.org'],
			['Geschichte', 'vorname.nachname@schulcloud.org']
		];

		return (
			<section className="section-courses section-default">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Lehrer</h5>

							<Table head={tableHead} body={tableBody} />
							<button type="submit" className="btn btn-primary" onClick={this.openModal.bind(this, '')}>
								Lehrer hinzuf&uuml;gen
							</button>
						</div>
					</div>
				</div>

				{this.modalUI()}
			</section>
		);
	}

}

export default SectionTeachers;
