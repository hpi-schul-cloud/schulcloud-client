require('../styles/school.scss');

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
				this.props.actions.addCourse(data);
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

	modalFormUI(courseId = 0) {
		return (
			<div className="edit-form">
				<div className="form-group">
					<label htmlFor="">Name des Kurses *</label>
					<input type="text" className="form-control" placeholder="Mathe" name="name" required/>
				</div>

				<input type="hidden" name="schoolId" value="582c58c72038900b2b7010a8"/>

				<input type="hidden" name="classId" value="58407f3f8fd94f15f984ab03"/>

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
					<input type="text" className="form-control" placeholder="Wöchentlich" name="frequency" required/>
				</div>
			</div>
		);
	}


	removeRecord(record) {
		this.props.actions.removeCourse(record);
	}

	getTableHead() {
		return ['ID', 'Name', 'Klasse(n)', 'Erstellt am', ''];
	}

	getTableBody() {
		return this.props.courses.map((c) => {
			return [c._id, c.name, c.classId, c.createdAt, this.getTableActions(this.actions, c)];
		});
	}
}

export default SectionCourses;
