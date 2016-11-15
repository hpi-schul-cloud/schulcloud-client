require('../styles/directories.scss');

class Directories extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	/* Mock data */
	getData() {
		return [{

		}];
	}

	render() {
		return (
			<section className="directories">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Meine Ordner</h5>
						</div>
					</div>
					<div className="row">
						<div className="row">
							<div className="col-sm-6 col-xs-12 col-md-4" >
								<div className="card card-block folder">
									<strong className="card-title-directory"><i className="fa fa-folder" aria-hidden="true"></i> Bilder</strong>
								</div>
							</div>
							<div className="col-sm-6 col-xs-12 col-md-4">
								<div className="card card-block folder">
									<strong className="card-title"><i className="fa fa-folder" aria-hidden="true"></i> Dokumente</strong>
								</div>
							</div>
							<div className="col-sm-6 col-xs-12 col-md-4">
								<div className="card card-block folder">
									<strong className="card-title"><i className="fa fa-folder" aria-hidden="true"></i> Videos</strong>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default Directories;
