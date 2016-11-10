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
						<div className="card card-block col-md-3 col-sm-12 col-xs-12">
							<h3 className="card-title"><i className="fa fa-picture-o" aria-hidden="true"></i> Bilder</h3>
						</div>
						<div className="card card-block col-md-3 col-sm-12 col-xs-12">
							<h3 className="card-title"><i className="fa fa-file-text-o" aria-hidden="true"></i> Dokumente</h3>
						</div>
						<div className="card card-block col-md-3 col-sm-12 col-xs-12">
							<h3 className="card-title"><i className="fa fa-video-camera" aria-hidden="true"></i> Videos</h3>
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default Directories;
