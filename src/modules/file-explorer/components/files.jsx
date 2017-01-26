require('../styles/files.scss');

class Files extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	handleOnFileClick(file) {
		this.props.actions.download(file);
	}

	getFileUI(file) {
		return (
			<div className="col-sm-6 col-xs-12 col-md-4" key={file.name}>
				<div className="card file">
					<div className="card-block">
							<div className="card-title">
								<div className="col-sm-3 no-padding">
									<div className="file-preview" style={{'background-image': 'url(' + file.thumbnail + ')'}}></div>
								</div>
								<large>{file.name}</large>
							</div>
							<div className="card-text">
								<i className="fa fa-cloud-download" aria-hidden="true" onClick={this.handleOnFileClick.bind(this, file)}/>
							</div>
					</div>
				</div>
			</div>
		);
	}

	getFilesUI() {
		return (
		<div>
			{this.props.files.map((file) => {
				return this.getFileUI(file);
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
