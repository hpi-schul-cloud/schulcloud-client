import SystemSelector from './systemSelector';

import {
	Form,
	Input
} from '../../core/helpers/form';


class LoginForm extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="form-group">
				<Form onValidSubmit={this.props.onLogin.bind(this)}>
					<Input
						type="text"
						name="username"
						className="form-control form-control-lg"
						placeholder="Email-Adresse oder Nutzername"
						layout="elementOnly"
					/>
					<Input
						type="password"
						className="form-control form-control-lg"
						placeholder="Passwort"
						layout="elementOnly"
						name="password"
					/>

					<SystemSelector {...this.props} />

					<button
						className="btn btn-primary btn-block"
						type="submit"
					>
						Anmelden
					</button>
				</Form>
			</div>
		);
	}

}

export default LoginForm;
