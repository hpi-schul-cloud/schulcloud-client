require('../styles/files.scss');

class Files extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	getFilesUI() {
		return (
		<div>
		{this.props.files.map((file) => {
			return (
				<div className="col-sm-6 col-xs-12 col-md-4" key={file.name}>
					<div className="card file">
						<div className="container-fluid">
							<div className="row">
								<div className="col-sm-3 no-padding">
									<div className="file-preview" style={{'background-image': 'url(' + file.thumbnail + ')'}}></div>
								</div>
								<div className="col-sm-9">
									<strong>{file.name}</strong>
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		})}
			</div>
		);
	}

	render() {
		return (
			<section className="files">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Meine Dateien</h5>
						</div>
					</div>
					<div className="row">
						<div className="row">
							{this.getFilesUI()}
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default Files;
