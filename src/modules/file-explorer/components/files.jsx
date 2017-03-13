require('../styles/files.scss');
import Directories from './directories';

class Files extends React.Component {

	constructor(props) {
		super(props);

		this.state = { };
	}

	getStorageTitle(storageContext) {
		const storageTitles = {
			users: "Meine persönlichen Dateien",
			courses: "Kurs-Dateien",
			classes: "Klassen-Dateien"
		};

		let values = storageContext.split("/");
		let dirName = values.filter((v, index) => {
			return index > 1;
		}).join("/");
		return `${storageTitles[values[0]]} /${dirName}`;
	}

    preventEventPropagation(e){
        if (!e) var e = window.event;
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
	}

	handleOnDownloadClick(file,e) {
		this.preventEventPropagation(e);
		this.props.actions.download(file, this.props.storageContext);
	}

	handleOnDeleteClick(file) {
		this.props.actions.delete(file, this.props.storageContext).then(res => {
			this.props.onReload(this.props.storageContext, this.props.scopes);
		});
	}

	handleOnOpenClick(file){
        return this.props.actions.open(file, this.props.storageContext);
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
					<div className="openFile"  onClick={this.handleOnOpenClick.bind(this, file)}>
					<div className="card-block">
						<div className="card-title">
							<div className="col-sm-3 no-padding">
								<div className="file-preview" style={{'background-image': 'url(' + file.thumbnail + ')'}}></div>
							</div>
							<large>{file.name}</large>
						</div>
						<div className="card-text">
							<i className="fa fa-cloud-download" aria-hidden="true" onClick={this.handleOnDownloadClick.bind(this, file)}/>
							<i className="fa fa-trash-o" aria-hidden="true" data-toggle="modal" data-target={`#deleteFileModal${file.id}`} onClick={this.preventEventPropagation}/>
						</div>
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
					<Directories {...this.props} />
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
