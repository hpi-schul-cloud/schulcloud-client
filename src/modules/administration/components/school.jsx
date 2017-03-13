class SectionSchool extends React.Component {

	constructor(props) {
		super(props);
		
		this.state = {
			schoolName: this.props.school.name
		};
	}

	updateSchoolName(event) {
		this.setState({
			schoolName: event.target.value
		});
	}

	updateSchool() {
		this.props.actions.updateRecord('/schools', {
			_id: this.props.school._id,
			name: this.state.schoolName
		})
			.catch(e=>console.error(e));
	}

	render() {
		return (
			<section className="section-school section-default">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">

							<h5>Schule</h5>

							<div className="form-group">
								<label htmlFor="exampleInputEmail1">Name der Schule</label>
								<input defaultValue={this.props.school.name} id="schoolName" type="text" className="form-control" onChange={this.updateSchoolName.bind(this)} placeholder="Einhorn Gymnasium" required />
							</div>

							<button type="submit" onClick={this.updateSchool.bind(this)} className="btn btn-primary">Speichern</button>

						</div>
					</div>
				</div>
			</section>
		);
	}
}

SectionSchool.defaultProps = {
	school: {}
}

export default SectionSchool;
