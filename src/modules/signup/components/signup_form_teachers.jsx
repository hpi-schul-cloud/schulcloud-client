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
import Table from '../../administration/components/table';
import {Link} from 'react-router';

class SignupFormTeachers extends React.Component {

	constructor(props) {
		super(props);
	}

	getTableHead() {
		return [
			'Name',
			'E-Mail-Adresse'
		];
	}

	getTableBody() {
		return [["Maria Musterfrau", "maria@gmx.de"]];
	}

	render() {
		return (
			<div>
				<h1>Administration: <br />Lehrkräfte</h1>

				<p>Ihr Account wurde freigeschaltet und die Schule freigegeben.
					Sie können nun Lehrkräfte (Lehrer/innen, Betreuer, ...) anlegen.</p>

				<p><b>Tipp:</b> Sie können auch nach Abschluss der Registrierung
					jeder Zeit weitere Lehrkräfte hinzufügen.</p>

				<Form>
					<div className="row">
						<div className="col-md-12">
							<Table head={this.getTableHead()} body={this.getTableBody()} />
						</div>
					</div>
				</Form>

				<button className="btn btn-success">Lehrkraft hinzufügen</button>

				<hr />

				<p>Im <b>nächsten Schritt</b> können Sie Klassen anlegen.</p>

				<Link className="btn btn-secondary" to="/signup/classes/">Fortsetzen</Link>
			</div>
		);
	}

}

export default SignupFormTeachers;



