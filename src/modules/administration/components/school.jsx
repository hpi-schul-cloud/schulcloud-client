import {
	Input,
	Select,
	Form
} from '../../core/helpers/form';

require('../styles/school.scss');

class SectionSchool extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			newFileStorage: this.getStorageProviders()[0].value
		};
	}

	getStorageProviders() {
		return [
			{label: 'AWS S3', value: 'awsS3'}
		];
	}

	updateSchool(data) {
		this.props.actions.updateRecord('/schools', {
			_id: this.props.school._id,
			name: data.name,
			fileStorageType: data.storageType
		})
			.catch(e => console.error(e));
	}

	handleNewFileStorageChange(event) {
		this.setState({newFileStorage: event.target.value});
	}

	createBucket() {
		this.props.actions.updateRecord('/schools', {
			_id: this.props.school._id,
			fileStorageType: this.state.newFileStorage
		}).then(res => {
			this.props.actions.createBucket(res._id).then(res => {
				this.props.actions.loadContent()
			});
		});
	}

	getStorageProviderUI() {
		return this.props.school.fileStorageType ? (
				<Select
					label="Cloud-Storage Anbieter"
					name="storageType"
					type="text"
					options={this.getStorageProviders()}
					layout="vertical"
					value={this.props.school.fileStorageType}>
				</Select>
		)
			: (
			<div className="add-storage-provider">
				<label>Cloud-Storage Anbieter</label>
				<p>Diese Schule besitzt noch keinen Anbieter.</p>
				<div>
					<Select
						name="storageType"
						type="text"
						options={this.getStorageProviders()}
						layout="vertical"
						value={this.state.newFileStorage}
						onChange={this.handleNewFileStorageChange.bind(this)}>
					</Select>
					<button type="submit" className="btn btn-default" onClick={this.createBucket.bind(this)}>Anbieter hinzufügen</button>
				</div>
			</div>
		);
	}

	render() {
		return (
			<section className="section-school section-default">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">

							<h5>Schule</h5>

							<Form className="school-form" onValidSubmit={this.updateSchool.bind(this)}>
								<Input
									label="Name der Schule"
									type="text"
									name="name"
									layout="vertical"
									value={this.props.school.name}/>
								{
									this.getStorageProviderUI()
								}
								<button
									type="submit"
									className="btn btn-primary">Speichern
								</button>
							</Form>
						</div>
					</div>
				</div>
			</section>
		);
	}
}

SectionSchool.defaultProps = {
	school: {}
}

export default SectionSchool;
