import {
	Input,
	ReactSelect
} from '../../core/helpers/form';

import AdminSection from './admin-section';

class SectionCourses extends AdminSection {

	constructor(props) {
		super(props);

		const options = {
			title: 'Kurse',
			addLabel: 'Kurs hinzufügen',
			editLabel: 'Kurs bearbeiten',
		};
		Object.assign(this.options, options);

		this.actions = [
			{
				action: this.openModal.bind(this),
				icon: 'edit'
			},
			{
				action: this.removeRecord,
				icon: 'trash-o'
			}
		];

		Object.assign(this.state, {teachers: [], classes: []});

		this.loadContentFromServer = this.props.actions.loadContent.bind(this, '/courses');
		this.serviceName = '/courses';
	}

	componentDidMount() {
		super.componentDidMount();
		this.loadTeachers();
		this.loadClasses();
	}

	contentQuery() {
		const schoolId = this.props.schoolId;
		return {
			schoolId,
			$populate: ['classId', 'teacherIds']
		};
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
		return Object.keys(this.state.records).map((id) => {
			const c = this.state.records[id];
			return [
				c.name,
				(c.classIds || []).map(cl => cl.name).join(', '),
				c.teacherIds.map(teacher => teacher.lastName).join(', '),
				this.getTableActions(this.actions, c)
			];
		});
	}

	getTeacherOptions() {
		return this.state.teachers.map((r) => {
			return {
				label: r.lastName || r._id,
				value: r._id
			};
		});
	}

	getClassOptions() {
		return this.state.classes.map((r) => {
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
				value={this.props.schoolId}
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
