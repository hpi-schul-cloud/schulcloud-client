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
				this.props.actions.updateStudent(data);
			}
		};

		this.defaultRecord = {
			userName: '',
			roles: ['583ead19ee1321739414d3db']  // TODO: no _id
		};

		this.actions = [
			{
				action: this.openModal.bind(this),
				icon: 'edit'
			}
		]
	}

	modalFormUI() {
		const record = this.state.record;
		return (
			<div className="edit-form">
				<div className="form-group">
					<label>Name *</label>
					<input
						type="text"
						className="form-control"
						name="userName"
						value={record.userName}
						placeholder="Max Mustermann"
						onChange={this.handleRecordChange.bind(this)}
						required />
				</div>

				<div className="form-group">
					<label>E-Mail *</label>
					<input
						type="email"
						className="form-control"
						value={record.email}
						name="email"
						onChange={this.handleRecordChange.bind(this)}
						placeholder="test@test.org"
						required />
				</div>
			</div>
		);
	}

	removeRecord(record) {
		this.props.actions.removeStudent(record);
	}

	getTableHead() {
		return [
			'ID',
			'Name',
			'Klasse',
			'E-Mail-Adresse',
			'Erstellt am',
			''
		];
	}

	getTableBody() {
		return this.props.students.map((record) => {
			return [
				record._id,
				record.userName,
				record.class,
				record.email,
				record.createdAt,
				this.getTableActions(this.actions, record)
			];
		});
	}
}

export default SectionStudents;
