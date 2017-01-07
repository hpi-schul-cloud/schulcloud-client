import {
	Input,
	Form
} from '../../core/helpers/form';
import {Link} from 'react-router';

class SignupFormAdmin extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const options = [{ value: 'one', label: 'One' },
			{ value: 'two', label: 'Two' }];

		return (
			<div>
				<h1>Willkommen zur<br />Schul-Cloud</h1>

				<p>Im <b>ersten Schritt</b> würden wir Sie gerne besser kennen lernen:</p>

				<Form onValidSubmit={this.props.onFinishedSignupAdmin.bind(this)}>
					<Input
						name="roles"
						type="hidden"
						layout="elementOnly"
						value={["administrator"]}
					/>

					<div className="row">
						<div className="col-md-6">
							<Input
								label="Vorname"
								name="firstName"
								type="text"
								layout="vertical"
								required
							/>
						</div>
						<div className="col-md-6">
							<Input
								label="Nachname"
								name="lastName"
								type="text"
								layout="vertical"
								required
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
								required
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

					<p>Sie erhalten von uns nach dem Abschluss Ihrer Registrierung
						eine E-Mail mit Ihren Anmeldedaten (Nutzername und Passwort).</p>

					<p>Ihr Passwort können Sie danach jederzeit ändern.</p>

					<hr />

					<p>Im <b>nächsten Schritt</b> können Sie Informationen über die Schule
						und verwendete Systeme eintragen:</p>

					<button className="btn btn-success" type="submit">Fortsetzen</button>
				</Form>
			</div>
		);
	}

}

export default SignupFormAdmin;



