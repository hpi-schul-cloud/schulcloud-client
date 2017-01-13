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

class SetupFormSchool extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				<h1>Informationen <br />über die Schule</h1>

				<p>Damit unser Team die Schule überprüfen und im Anschluss
					freischalten kann werden ein paar Informationen benötigt.</p>

				<Form onValidSubmit={this.props.onUpdateSchool.bind(this)}>
					<Input
						name="_id"
						type="hidden"
						layout="elementOnly"
						value={this.props.school._id}
					/>

					<div className="row">
						<div className="col-md-12">
							<Input
								label="Name der Schule"
								name="name"
								type="text"
								layout="vertical"
								value={this.props.school.name}
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
								value={(this.props.school.address || {}).address}
								required
							/>
						</div>
					</div>

					<button className="btn btn-success" type="submit">Fortsetzen</button>

				</Form>
			</div>
		);
	}

}

export default SetupFormSchool;



