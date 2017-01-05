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

class SignupFormCourses extends React.Component {

	constructor(props) {
		super(props);
	}

	getTableHead() {
		return [
			'Name',
			'Klasse(n)',
			'Lehrer'
		];
	}

	getTableBody() {
		return [["Sport", "10a, 10b, 10c", "Maria Musterfrau"]];
	}

	render() {
		return (
			<div>
				<h1>Administration: <br />Kurse</h1>

				<p>Sie können nun Kurse anlegen und diesen Lehrkräfte zuweisen.</p>
				<p>"Kurse" bezeichnet sowohl Kurse in der Oberstufe, als auch Fächer für
					jede Klasse der Mittelstufe (also zum Beispiel "Mathe für die 10a").</p>

				<p><b>Tipp:</b> Lehrer können auch selber Kurse anlegen.</p>

				<Form>
					<div className="row">
						<div className="col-md-12">
							<Table head={this.getTableHead()} body={this.getTableBody()} />
						</div>
					</div>
				</Form>

				<button className="btn btn-success">Kurs hinzufügen</button>

				<hr />

				<Link className="btn btn-secondary" to="/administration/">Abschließen</Link>
			</div>
		);
	}

}

export default SignupFormCourses;



