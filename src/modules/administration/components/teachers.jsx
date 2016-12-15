import AdminSection from './admin-section';
import ModalForm from './modal-form';
import Table from './table';

class SectionTeachers extends AdminSection {

	constructor(props) {
		super(props);

		this.options = {
			title: 'Lehrer',
			addLabel: 'Lehrer hinzufügen',
			editLabel: 'Lehrer bearbeiten',
			submitCallback: (data) => {
				this.props.actions.updateTeacher(data);
			}
		};

		this.defaultRecord = {
			userName: '',
			roles: ['teacher']
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
					<label htmlFor="">Name *</label>
					<input
						type="text"
						className="form-control"
						name="userName"
						value={record.userName}
						placeholder="Herr Mustermann"
						onChange={this.handleRecordChange.bind(this)}
						required />
				</div>

				<div className="form-group">
					<label htmlFor="">E-Mail *</label>
					<input
						type="email"
						name="email"
						value={record.email}
						className="form-control"
						placeholder="test@test.org"
						onChange={this.handleRecordChange.bind(this)}
						required />
				</div>
			</div>
		);
	}

	removeRecord(record) {
		this.props.actions.removeTeacher(record);
	}

	getTableHead() {
		return [
			'ID',
			'Name',
			'E-Mail-Adresse',
			'Erstellt am',
			''
		];
	}

	getTableBody() {
		return this.props.teachers.map((record) => {
			return [
				record._id,
				record.userName,
				record.email,
				record.createdAt,
				this.getTableActions(this.actions, record)
			];
		});
	}

}

export default SectionTeachers;
