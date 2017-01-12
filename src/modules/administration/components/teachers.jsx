import {
	Input
} from '../../core/helpers/form';

import AdminSection from './admin-section';

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

		this.actions = [
			{
				action: this.openModal.bind(this),
				icon: 'edit'
			}
		]
	}

	getTableHead() {
		return [
			'Vorname',
			'Nachname',
			'E-Mail-Adresse',
			''
		];
	}

	getTableBody() {
		return this.props.teachers.map((record) => {
			return [
				record.firstName,
				record.lastName,
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
					value={["teacher"]}
				/>

				<Input
					label="Vorname"
					name="firstName"
					type="text"
					placeholder="Max"
					layout="vertical"
					value={record.firstName || ''}
					required
				/>

				<Input
					label="Nachname"
					name="lastName"
					type="text"
					placeholder="Mustermann"
					layout="vertical"
					value={record.lastName || ''}
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

export default SectionTeachers;
