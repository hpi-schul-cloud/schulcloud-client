require('../styles/files.scss');

class Files extends React.Component {

	constructor(props) {
		super(props);
	}

	getStorageTitle(storageContext) {
		var values = storageContext.split("/");
		switch (values[0]) {
			case 'users': return `Meine persönlichen Dateien /${values.filter((v, index) => {
					return index > 1;
				}).join("/")}`;
			case 'courses': return "Kurs Dateien";
			case 'classes': return "Klassen Dateien";
			default: return "";
		}
	}

	handleOnDownloadClick(file) {
		this.props.actions.download(file, this.props.storageContext);
	}

	handleOnDeleteClick(file) {
		this.props.actions.delete(file, this.props.storageContext).then(res => {
			this.props.onReload(this.props.storageContext);
		});
	}

	getFileDeleteModalUI(file) {
		return (
			<div className="modal fade" id={`deleteFileModal${file.id}`} role="dialog" aria-labelledby="myModalLabel">
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span
								aria-hidden="true">&times;</span></button>
							<h4 className="modal-title" id="myModalLabel">Datei löschen</h4>
						</div>
						<div className="modal-body">
							<p>Möchtest du die Datei wirklich löschen?</p>
							<span>
								<button type="button" className="btn btn-default" data-dismiss="modal" aria-label="Close">
									Abbrechen
								</button>
								<button onClick={this.handleOnDeleteClick.bind(this, file)} type="button" className="btn btn-primary" data-dismiss="modal" aria-label="Close">
									Löschen
								</button>
							</span>
						</div>
					</div>
				</div>
			</div>
		);
	}

	getFileUI(file) {
		return (
			<div className="col-sm-6 col-xs-12 col-md-4" key={`file${file.id}`}>
				<div className="card file">
					<div className="card-block">
							<div className="card-title">
								<div className="col-sm-3 no-padding">
									<div className="file-preview" style={{'background-image': 'url(' + file.thumbnail + ')'}}></div>
								</div>
								<large>{file.name}</large>
							</div>
							<div className="card-text">
								<i className="fa fa-cloud-download" aria-hidden="true" onClick={this.handleOnDownloadClick.bind(this, file)}/>
								<i className="fa fa-trash-o" aria-hidden="true" data-toggle="modal" data-target={`#deleteFileModal${file.id}`}/>
							</div>
					</div>
				</div>
				{ this.getFileDeleteModalUI(file) }
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

	getStorageContextUI() {
		return (
			<h5>
				{this.getStorageTitle(this.props.storageContext)}
			</h5>
		);
	}

	render() {
		return (
			<section className="files">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							{this.getStorageContextUI()}
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
