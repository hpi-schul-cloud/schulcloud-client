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
import {Link} from 'react-router';

import Table from '../../administration/components/table';
import AdminSectionClasses from '../../administration/containers/classes';

class SetupFormClasses extends AdminSectionClasses {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				<h1>Administration: <br />Klassen</h1>

				<p>Sie können nun Klassen anlegen und diesen Lehrkräfte zuweisen.</p>

				<p><b>Tipp:</b> Lehrer können auch selber Klassen anlegen.</p>

				<AdminSectionClasses />

				<hr />

				<p>Im <b>nächsten Schritt</b> können Sie Kurse anlegen:</p>

				<Link className="btn btn-secondary" to="/signup/courses/">Fortsetzen</Link>
			</div>
		);

	}

}

export default SetupFormClasses;



