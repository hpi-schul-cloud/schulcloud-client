require('../styles/directories.scss');

class Directories extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	getDirectoryUI(directory) {
		return (
			<div className="col-sm-6 col-xs-12 col-md-4" key={`directory${directory.id}`} >
				<div className="card card-block folder">
					<strong className="card-title-directory"><i className="fa fa-folder" aria-hidden="true"></i> {directory.name}</strong>
				</div>
			</div>
		);
	}

	getDirectoriesUI() {
		return (
			<div>
				{this.props.directories.map(d => {
					return this.getDirectoryUI(d);
				})}
			</div>
		);
	}

	render() {
		return (
			<section className="directories">
				<div className="container-fluid">
					<div className="row">
						<div className="row">
							{this.getDirectoriesUI()}
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default Directories;
