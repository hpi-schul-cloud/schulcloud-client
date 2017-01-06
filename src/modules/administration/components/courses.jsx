import {
	Input,
	ReactSelect
} from '../../core/helpers/form';

import AdminSection from './admin-section';

class SectionCourses extends AdminSection {

	constructor(props) {
		super(props);

		this.options = {
			title: 'Kurse',
			addLabel: 'Kurs hinzufügen',
			editLabel: 'Kurs bearbeiten',
			submitCallback: (data) => {
				// selected options to array of ids
				data.teacherIds = data.teacherIds.map(r => r.value);
				data.classIds = data.classIds.map(r => r.value);

				this.props.actions.updateCourse(data);
			}
		};

		this.actions = [
			{
				action: this.openModal.bind(this),
				icon: 'edit'
			},
			{
				action: this.props.actions.removeCourse.bind(this),
				icon: 'trash-o'
			}
		]
	}

	getTableHead() {
		return [
			'Name',
			'Klasse(n)',
			''
		];
	}

	getTableBody() {
		return this.props.courses.map((c) => {
			return [
				c.name,
				c.classIds,
				this.getTableActions(this.actions, c)
			];
		});
	}

	getTeacherOptions() {
		return this.props.teachers.map((r) => {
			return {
				label: r.userName || r._id,
				value: r._id
			};
		});
	}

	getClassOptions() {
		return this.props.classes.map((r) => {
			return {
				label: r.name || r._id,
				value: r._id
			};
		});
	}

	modalFormUI(courseId) {
		const record = this.state.record;
		return (
		<div>
			<Input
				name="schoolId"
				type="hidden"
				layout="elementOnly"
				value={this.props.school._id}
			/>

			<Input
				label="Name des Kurses"
				name="name"
				type="text"
				placeholder="Mathe"
				layout="vertical"
				value={record.name}
				required
			/>

			<ReactSelect
				label="Unterrichtender Lehrer"
				name="teacherIds"
				type="text"
				placeholder="Frau Musterfrau"
				layout="vertical"
				value={record.teacherIds}
				options={this.getTeacherOptions()}
				multi
				required
			/>

			<ReactSelect
				label="Klasse(n)"
				name="classIds"
				type="text"
				placeholder="10a"
				layout="vertical"
				value={record.classIds}
				options={this.getClassOptions()}
				multi
				required
			/>

			<Input
				label="Termin"
				name="date"
				type="date"
				layout="vertical"
				value={record.date}
				required
			/>
		</div>
		);
	}
}

export default SectionCourses;
