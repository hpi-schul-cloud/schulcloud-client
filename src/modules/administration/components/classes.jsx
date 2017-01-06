import {
	Input,
	ReactSelect,
	Form
} from '../../core/helpers/form';

import AdminSection from './admin-section';

class SectionClasses extends AdminSection {

	constructor(props) {
		super(props);

		this.options = {
			title: 'Klassen',
			addLabel: 'Klasse hinzufügen',
			editLabel: 'Klasse bearbeiten',
			submitCallback: (data) => {
				console.log(data);
				this.props.actions.updateClass(data);
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

	getTeacherOptions() {
		return this.props.teachers.map((r) => {
			return {
				label: r.userName || r._id,
				value: r._id
			};
		});
	}

	modalFormUI() {
		const record = this.state.record;
		return (
			<div>
				<Input
					label="Name der Klasse"
					name="name"
					type="text"
					placeholder="10a"
					layout="vertical"
					value={record.name}
					required
				/>

				<ReactSelect
					label="Klassenlehrer"
					name="teacherIds"
					type="text"
					placeholder="Frau Musterfrau"
					layout="vertical"
					value={record.teacherIds}
					multi
					options={this.getTeacherOptions()}
					required
				/>
			</div>
		);
	}

	removeRecord(record) {
		this.props.actions.removeClass(record);
	}

	getTableHead() {
		return [
			'Bezeichnung',
			'Lehrer',
			''
		];
	}

	getTableBody() {
		return this.props.classes.map((c) => {
			return [
				c.name,
				c.teacherIds,
				this.getTableActions(this.actions, c)
			];
		});
	}
}

export default SectionClasses;
