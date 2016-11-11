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
					<strong>Ordner</strong>
					<div className="row">
						<div className="col-sm-6 col-xs-12 col-md-4" >
							<div className="card card-block">
								<h5 className="card-title-directory"><i className="fa fa-picture-o" aria-hidden="true"></i> Bilder</h5>
							</div>
						</div>
						<div className="col-sm-6 col-xs-12 col-md-4">
							<div className="card card-block">
								<h5 className="card-title"><i className="fa fa-file-text-o" aria-hidden="true"></i> Dokumente</h5>
							</div>
						</div>
						<div className="col-sm-6 col-xs-12 col-md-4">
							<div className="card card-block">
								<h5 className="card-title"><i className="fa fa-video-camera" aria-hidden="true"></i> Videos</h5>
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default Directories;
