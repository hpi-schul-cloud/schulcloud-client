import {
	Input
} from '../../core/helpers/form';

import AdminSection from './admin-section';

class SectionStudents extends AdminSection {

	constructor(props) {
		super(props);

		const options = {
			title: 'Schüler',
			addLabel: 'Schüler hinzufügen',
			editLabel: 'Schüler bearbeiten',
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

		this.loadContentFromServer = this.props.actions.loadContent.bind(this, '/users');
		this.serviceName = '/users';
	}

	contentQuery() {
		const schoolId = this.props.schoolId;
		return {
			schoolId,
			roles: ['student']
		};
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
		return Object.keys(this.state.records).map((id) => {
			const record = this.state.records[id];
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
					value={this.props.schoolId}
				/>

				<Input
					name="roles"
					type="hidden"
					layout="elementOnly"
					value={["student"]}
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

export default SectionStudents;
