import Layout from '../../core/components/layout';

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

require('../styles/signup.scss');

class Signup extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const options = [{ value: 'one', label: 'One' },
			{ value: 'two', label: 'Two' }];
		return (
			<Layout className="route-signup">
				<div className="container">
					<div className="row">
						<div className="col-md-6 offset-md-3">
							<h1>Willkommen zur<br />Schul-Cloud</h1>

							<p>Im <b>ersten Schritt</b> würden wir Sie gerne besser kennen lernen:</p>

							<Form>
								<div className="row">
									<div className="col-md-6">
										<Input
											label="Vorname"
											name="firstName"
											type="text"
											layout="vertical"
										/>
									</div>
									<div className="col-md-6">
										<Input
											label="Nachname"
											name="lastName"
											type="text"
											layout="vertical"
										/>
									</div>
								</div>

								<div className="row">
									<div className="col-md-12">
										<Input
											label="E-Mail"
											name="email"
											type="email"
											validations="isEmail"
											validationError="This is not an email"
											layout="vertical"
										/>
									</div>
								</div>

								<div className="row">
									<div className="col-md-12">
										<Input
											label="Telefon"
											name="tel"
											type="tel"
											validations="isNumeric"
											validationError="Nur Ziffern, keine Leerzeichen und Striche"
											layout="vertical"
										/>
									</div>
								</div>

								<div className="row">
									<div className="col-md-12">
										<ReactSelect
											label="Person"
											name="person"
											layout="vertical"
											options={options}
										/>
									</div>
								</div>
							</Form>

							<p>Sie erhalten von uns nach dem Abschluss Ihrer Registrierung
								eine E-Mail mit Ihren Anmeldedaten (Nutzername und Passwort).</p>

							<p>Ihr Passwort können Sie danach jederzeit ändern.</p>

							<hr />

							<p>Im <b>nächsten Schritt</b> können Sie Informationen über die Schule
								und verwendete Systeme eintragen:</p>

							<button className="btn btn-success">Fortsetzen</button>
						</div>
					</div>
				</div>
			</Layout>
		);
	}

}

export default Signup;
