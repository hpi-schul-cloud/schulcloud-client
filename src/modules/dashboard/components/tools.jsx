require('../styles/tools.scss');

class SectionTools extends React.Component {

	constructor(props) {
		super(props);
	}

	getButtonUI(button) {
		return (
			<div className="col-sm-3" key={button.label}>
				<button className="btn btn-block" onClick={(button.action || (() => {})).bind(this)}>
					<i className={`fa fa-${button.icon}`} />
					<span>{button.label}</span>
				</button>
			</div>
		);
	}

	render() {
		return (
			<section className="section-tools">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Tools</h5>
						</div>
					</div>
					<div className="row buttons">
						<div className="row">
							{(this.props.buttons || []).map((button) => {
								return this.getButtonUI(button);
							})}
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default SectionTools;
