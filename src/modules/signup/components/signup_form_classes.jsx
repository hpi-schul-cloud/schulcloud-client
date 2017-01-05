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

class SignupFormClasses extends React.Component {

	constructor(props) {
		super(props);
	}

	getTableHead() {
		return [
			'Name', 'Lehrer'
		];
	}

	getTableBody() {
		return [["10a", "Maria Musterfrau"]];
	}

	render() {
		return (
			<div>
				<h1>Administration: <br />Klassen</h1>

				<p>Sie können nun Klassen anlegen und diesen Lehrkräfte zuweisen.</p>

				<p><b>Tipp:</b> Lehrer können auch selber Klassen anlegen.</p>

				<Form>
					<div className="row">
						<div className="col-md-12">
							<Table head={this.getTableHead()} body={this.getTableBody()} />
						</div>
					</div>
				</Form>

				<button className="btn btn-success">Klasse hinzufügen</button>

				<hr />

				<p>Im <b>nächsten Schritt</b> können Sie Kurse anlegen:</p>

				<Link className="btn btn-secondary" to="/signup/courses/">Fortsetzen</Link>
			</div>
		);
	}

}

export default SignupFormClasses;



