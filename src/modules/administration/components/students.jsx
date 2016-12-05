import AdminSection from './admin-section';
import ModalForm from './modal-form';
import Table from './table';

class SectionStudents extends AdminSection {

	constructor(props) {
		super(props);

		this.options = {
			title: 'Schüler',
			addLabel: 'Schüler hinzufügen',
			editLabel: 'Schüler bearbeiten',
			submitCallback: (data) => {
				this.props.actions.addStudent(data);
			}
		};

		this.actions = [
			{
				action: this.openModal.bind(this),
				icon: 'edit'
			},
			{
				action: this.removeRecord.bind(this),
				icon: 'trash-o'
			}
		]
	}

	modalFormUI(record) {
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


	removeRecord(record) {
		this.props.actions.removeStudent(record);
	}

	getTableHead() {
		return ['ID', 'Name', 'Klasse', 'E-Mail-Adresse', 'Erstellt am', ''];
	}

	getTableBody() {
		return this.props.students.map((record) => {
			return [record._id, record.name, record.class, record.email, record.createdAt, this.getTableActions(this.actions, record)];
		});
	}

}

export default SectionStudents;
