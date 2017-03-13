require('../styles/directories.scss');

class NewDirectory extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			newDirectoryName: ""
		};
	}

	handleChangeNewDirectoryField(e) {
		this.setState({
			newDirectoryName: e.target.value
		});
	}

	handleOnNewDirectoryClick() {
		this.props.actions.createNewFolder(this.state.newDirectoryName, this.props.storageContext).then(res => {
			this.props.onReload(this.props.storageContext, this.props.scopes);
		});
	}

	getNewDirectoryModalUI() {
		return (
			<div className="modal fade" id="newDirectoryModal" role="dialog" aria-labelledby="myModalLabel">
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span
								aria-hidden="true">&times;</span></button>
							<h4 className="modal-title" id="myModalLabel">Ordner hinzufügen</h4>
						</div>
						<div className="modal-body">
							<input type="text" value={this.state.newDirectoryName} onChange={this.handleChangeNewDirectoryField.bind(this)} />
							<br></br>
							<span>
								<button type="button" className="btn btn-default" data-dismiss="modal" aria-label="Close">
									Abbrechen
								</button>
								<button type="button" onClick={this.handleOnNewDirectoryClick.bind(this)} className="btn btn-primary" data-dismiss="modal" aria-label="Close">
									Erstellen
								</button>
							</span>
						</div>
					</div>
				</div>
			</div>
		);
	}

	render() {
		return (
			<div className="col-sm-6 col-xs-12 col-md-4">
				 <div data-toggle="modal" data-target="#newDirectoryModal">
					<div className="newDirectoryCard card card-block folder">
						<strong className="card-title-directory"><i className="fa fa-folder" aria-hidden="true"></i> Neuen Ordner erstellen ... </strong>
					</div>
				 </div>
				{this.getNewDirectoryModalUI()}
			</div>
		);
	}

}

export default NewDirectory;
