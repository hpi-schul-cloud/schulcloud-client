require('../styles/school.scss');

import ModalForm from './modal-form';
import Table from './table';

class SectionClasses extends React.Component {

	constructor(props) {
		super(props);
		this.state = {};
	}

	editClassUI(classId = 0) {
		return (
			<div className="edit-form">
				<div className="form-group">
					<label htmlFor="">Name der Klasse *</label>
					<input type="text" className="form-control" name="name" placeholder="Mathe" required />
				</div>

				<input type="hidden" name="schoolId" value="582c58c72038900b2b7010a8" />

				<div className="form-group">
					<label htmlFor="">Klassenlehrer</label>
					<select className="form-control" name="teacherId" id="">
						<option>1</option>
						<option>2</option>
						<option>3</option>
						<option>4</option>
						<option>5</option>
					</select>
				</div>
			</div>
		);
	}

	modalUI() {
		const title = this.state.classId ? "Klasse bearbeiten" : "Klasse hinzufügen";
		return (
			<ModalForm
				title={title}
				content={this.editClassUI()}
				id="classModal"
				classId={this.state.classId}
				submitCallback={(data) => {
					this.props.actions.addClass(data);
				}}
			/>
		);
	}

	openModal(classId) {
		this.setState({
			classId
		});
		$('#classModal').modal('show');
	}

	render() {
		const tableHead = ['ID', 'Bezeichnung', 'Erstellt am'];
		const tableBody = this.props.classes.map((c) => {
			return [c._id, c.name, c.createdAt];
		});

		return (
			<section className="section-courses section-default">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Klassen</h5>

							<Table head={tableHead} body={tableBody} />
							<button type="submit" className="btn btn-primary" onClick={this.openModal.bind(this, '')}>
								Klasse hinzuf&uuml;gen
							</button>
						</div>
					</div>
				</div>

				{this.modalUI()}
			</section>
		);
	}

}

export default SectionClasses;
