import AdminSection from './admin-section';
import ModalForm from './modal-form';
import Table from './table';

class SectionCourses extends AdminSection {

	constructor(props) {
		super(props);

		this.options = {
			title: 'Kurse',
			addLabel: 'Kurs hinzufügen',
			editLabel: 'Kurs bearbeiten',
			submitCallback: (data) => {
				this.props.actions.updateCourse(data);
			}
		};

		this.defaultRecord = {
			name: '',
			schoolId: '582c58c72038900b2b7010a8', // TODO: no _id
			classId: '58407f3f8fd94f15f984ab03' // TODO: no _id
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

	modalFormUI(courseId) {
		const record = this.state.record;
		return (
			<div className="edit-form">
				<div className="form-group">
					<label>Name des Kurses *</label>
					<input
						type="text"
						value={record.name}
						className="form-control"
						name="name"
						placeholder="Mathe"
						onChange={this.handleRecordChange.bind(this)}
						required />
				</div>

				<div className="form-group">
					<label>Unterrichtender Lehrer *</label>
					<select
						value={record.teacherId}
						className="form-control"
						name="teacherId"
						onChange={this.handleRecordChange.bind(this)}
						required
						multiple>
						{this.props.teachers.map((r) => {
							return (<option key={r._id} value={r._id}>{r.userName || r._id}</option>);
						})}
					</select>
				</div>

				<div className="form-group">
					<label htmlFor="">Klasse(n)</label>
					<select
						value={record.classId}
						className="form-control"
						name="classId"
						onChange={this.handleRecordChange.bind(this)}
						required
						multiple>
						{this.props.classes.map((c) => {
							return (<option key={c._id} value={c._id}>{c.name}</option>);
						})}
					</select>
				</div>

				<div className="form-group">
					<label>Frequenz *</label>
					<input
						type="text"
						value={record.frequency}
						className="form-control"
						name="frequency"
						placeholder="Wöchentlich"
						onChange={this.handleRecordChange.bind(this)}
						required />
				</div>
			</div>
		);
	}

	removeRecord(record) {
		this.props.actions.removeCourse(record);
	}

	getTableHead() {
		return [
			'ID',
			'Name',
			'Klasse(n)',
			'Erstellt am',
			''
		];
	}

	getTableBody() {
		return this.props.courses.map((c) => {
			return [
				c._id,
				c.name,
				c.classId,
				c.createdAt,
				this.getTableActions(this.actions, c)
			];
		});
	}
}

export default SectionCourses;
