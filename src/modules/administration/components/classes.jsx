import {
	Input,
	ReactSelect
} from '../../core/helpers/form';

import AdminSection from './admin-section';

class SectionClasses extends AdminSection {

	constructor(props) {
		super(props);

		const options = {
			title: 'Klassen',
			addLabel: 'Klasse hinzufügen',
			editLabel: 'Klasse bearbeiten'
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

		Object.assign(this.state, {
			teachers: [],
			classes: []
		});

		this.loadContentFromServer = this.props.actions.loadContent.bind(this, '/classes');
		this.serviceName = '/classes';
	}

	componentDidMount() {
		super.componentDidMount();
		this.loadTeachers();
	}

	contentQuery() {
		const schoolId = this.props.schoolId;
		return {
			schoolId,
			$populate: ['teacherIds']
		};
	}

	getTableHead() {
		return [
			'Bezeichnung',
			'Lehrer',
			''
		];
	}

	customizeRecordBeforeInserting(data) {
		return this.props.actions.populateFields('/classes', data._id, ['teacherIds']);
	}

	getTableBody() {
		return Object.keys(this.state.records).map((id) => {
			const c = this.state.records[id];
			return [
				c.name,
				c.teacherIds.map(teacher => teacher.lastName).join(', '),
				this.getTableActions(this.actions, c)
			];
		});
	}

	getTeacherOptions() {
		return this.state.teachers.map((r) => {
			return {
				label: `${r.firstName || r._id} ${r.lastName || ""}`,
				value: r._id
			};
		});
	}

	modalFormUI() {
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
					label="Name der Klasse"
					name="name"
					type="text"
					placeholder="10a"
					layout="vertical"
					value={record.name || ''}
					required
				/>

				<ReactSelect
					label="Klassenlehrer"
					name="teacherIds"
					type="text"
					placeholder="Frau Musterfrau"
					layout="vertical"
					value={record.teacherIds || []}
					multiple
					options={this.getTeacherOptions()}
					required
				/>
			</div>
		);
	}
}

export default SectionClasses;
