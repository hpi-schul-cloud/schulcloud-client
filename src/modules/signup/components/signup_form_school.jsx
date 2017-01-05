import {
	Checkbox,
	CheckboxGroup,
	Icon,
	Input,
	RadioGroup,
	Row,
	Select,
	File,
	Textarea,
	ReactSelect,
	Form
} from '../../core/helpers/form';

class SignupFormAdmin extends React.Component {

	constructor(props) {
		super(props);
	}

	getSystemOptions() {
		return [
			{ value: 'moodle', label: 'Moodle' },
			{ value: 'lernsax', label: 'LernSax' },
			{ value: 'itslearning', label: 'ITSLearning' },
		];
	}

	render() {
		return (
			<div>
				<h1>Informationen <br />über die Schule</h1>

				<p>Damit unser Team die Schule überprüfen und im Anschluss
					freischalten kann werden ein paar Informationen benötigt.</p>

				<Form>
					<div className="row">
						<div className="col-md-12">
							<Input
								label="Name der Schule"
								name="name"
								type="text"
								layout="vertical"
								required
							/>
						</div>
					</div>

					<div className="row">
						<div className="col-md-12">
							<Input
								label="Anschrift"
								name="address"
								type="text"
								layout="vertical"
								required
							/>
						</div>
					</div>

					<div className="row">
						<div className="col-md-12">
							<label>Verwendete Systeme</label>
							<p className="text-muted">Wird an Ihrer Schule Moodle, LernSax oder ITSLearning verwendet?</p>
						</div>
						<div className="col-md-12">
							<div className="col-md-4 no-padding">
								<div className="form-group">
									<ReactSelect
										name="person"
										layout="elementOnly"
										options={this.getSystemOptions()}
									/>
								</div>
							</div>
							<div className="col-md-8 no-padding">
								<div className="form-group">
									<Input
										name="url"
										type="url"
										layout="elementOnly"
										placeholder="URL"
									/>
								</div>
							</div>
						</div>
						<div className="col-md-12">
							<p><a href="">+ Weiteres System hinzufügen</a></p>
						</div>
					</div>
				</Form>

				<p>Nach dem Abschluss der Registrierung wird unser Team
					Ihre Daten zeitnah prüfen und Ihnen im Anschluss
					Ihre Zugangsdaten zukommen lassen.</p>

				<button className="btn btn-success">Registrierung abschließen</button>
			</div>
		);
	}

}

export default SignupFormAdmin;



