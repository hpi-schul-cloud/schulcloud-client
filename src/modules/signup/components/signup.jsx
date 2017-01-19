import {
	Input,
	Form,
	validators
} from '../../core/helpers/form';
import Layout from '../../core/components/layout';

class Signup extends React.Component {

	constructor(props) {
		super(props);
	}


	getSharedFieldsUI() {
		return (
			<div>
				<Input
					name="schoolId"
					type="hidden"
					layout="elementOnly"
					value={this.props.schoolId}
				/>

				<Input
					name="accountId"
					type="hidden"
					layout="elementOnly"
					value={this.props.accountId}
				/>

				<Input
					name="roles"
					type="hidden"
					layout="elementOnly"
					value={[this.props.role]}
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
			</div>
		);
	}

	getAdminFieldsUI() {
		if(this.props.role !== 'admin') return;

		return (
			<div>
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
			</div>
		);
	}

	getPasswordFieldUI() {
		if(this.props.isSSO) return;

		return (
			<div className="row">
				<div className="col-md-12">
					<Input
						label="Passwort"
						name="password"
						type="password"
						layout="vertical"
						validations={{
							matchRegexp: validators.password
						}}
						validationError="Ihr Passwort stimmt nicht mit den Anforderungen überein"
						required
					/>
					<p className="text-muted">Ihr Passwort muss folgendes enthalten:</p>
					<ul className="text-muted">
						<li>Mindestens 8 Zeichen</li>
						<li>Groß- und Kleinschreibung</li>
						<li>Mindestens eine Zahl und Sonderzeichen</li>
					</ul>
				</div>
			</div>
		);
	}

	render() {
		return (
			<Layout className="route-signup">
				<div className="container">
					<div className="row">
						<div className="col-md-6 offset-md-3">
							<h1>Willkommen zur<br />Schul-Cloud</h1>

							<p>Im <b>diesem Schritt</b> würden wir Dich gerne besser kennen lernen:</p>

							<Form onValidSubmit={this.props.onSignup.bind(this)}>

								{this.getSharedFieldsUI()}
								{this.getAdminFieldsUI()}

								{this.getPasswordFieldUI()}

								<button className="btn btn-success" type="submit">Abschließen</button>
							</Form>
						</div>
					</div>
				</div>
			</Layout>
		);
	}

}

export default Signup;



