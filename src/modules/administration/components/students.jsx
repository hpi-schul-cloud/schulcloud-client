import {
	Input
} from '../../core/helpers/form';

import AdminSection from './admin-section';

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

		this.actions = [
			{
				action: this.openModal.bind(this),
				icon: 'edit'
			}
		]
	}

	getTableHead() {
		return [
			'Name',
			'E-Mail-Adresse',
			''
		];
	}

	getTableBody() {
		return this.props.students.map((record) => {
			return [
				record.userName,
				record.email,
				this.getTableActions(this.actions, record)
			];
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
					value={this.props.school._id}
				/>

				<Input
					name="roles"
					type="hidden"
					layout="elementOnly"
					value={["student"]}
				/>

				<Input
					label="Name"
					name="userName"
					type="text"
					placeholder="Max Mustermann"
					layout="vertical"
					value={record.userName || ''}
					required
				/>

				<Input
					label="E-Mail-Adresse"
					name="email"
					type="email"
					validations="isEmail"
					placeholder="test@test.org"
					validationError="This is not an email"
					layout="vertical"
					value={record.email || ''}
					required
				/>
			</div>
		);
	}
}

export default SectionStudents;
