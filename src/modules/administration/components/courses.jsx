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
				// TODO: make sure data.classId works on edit
				console.log(data);

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
			'Lehrer',
			''
		];
	}

	getTableBody() {
		return this.props.courses.map((c) => {
			return [
				c.name,
				c.classIds.map(id => this.props.classesById[id].name).join(', '),
				c.teacherIds.map(id => (this.props.teachersById[id] || {}).lastName).join(', '),
				this.getTableActions(this.actions, c)
			];
		});
	}

	getTeacherOptions() {
		return this.props.teachers.map((r) => {
			return {
				label: r.lastName || r._id,
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
				name="_id"
				type="hidden"
				layout="elementOnly"
				value={this.state.record._id}
			/>

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
				value={record.name || ''}
				required
			/>

			<ReactSelect
				label="Unterrichtender Lehrer"
				name="teacherIds"
				type="text"
				placeholder="Frau Musterfrau"
				layout="vertical"
				value={record.teacherIds || []}
				options={this.getTeacherOptions()}
				multiple
				required
			/>

			<ReactSelect
				label="Klasse(n)"
				name="classIds"
				type="text"
				placeholder="10a"
				layout="vertical"
				value={record.classIds || []}
				options={this.getClassOptions()}
				multiple
				required
			/>
		</div>
		);
	}
}

export default SectionCourses;
