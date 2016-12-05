require('../styles/school.scss');

import AdminSection from './admin-section';
import ModalForm from './modal-form';
import Table from './table';

class SectionClasses extends AdminSection {

	constructor(props) {
		super(props);

		this.options = {
			title: 'Klassen',
			addLabel: 'Klasse hinzufügen',
			editLabel: 'Klasse bearbeiten',
			submitCallback: (data) => {
				this.props.actions.addClass(data);
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
					<label htmlFor="">Name der Klasse *</label>
					<input type="text" defaultValue={record.name} className="form-control" name="name" placeholder="Mathe" required />
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

	removeRecord(record) {
		this.props.actions.removeClass(record);
	}

	getTableHead() {
		return ['ID', 'Bezeichnung', 'Erstellt am', ''];
	}

	getTableBody() {
		return this.props.classes.map((c) => {
			return [c._id, c.name, c.createdAt, this.getTableActions(this.actions, c)];
		});
	}
}

export default SectionClasses;
