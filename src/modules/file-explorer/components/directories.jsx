require('../styles/directories.scss');
import NewDirectory from './newDirectory';

class Directories extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	handleOnDirectoryClick(directory) {
		this.props.onReload(`${this.props.storageContext}/${directory.name}`);
	}

	handleOnDeleteClick(directory) {
		this.props.actions.deleteDirectory(this.props.storageContext, directory).then(res => {
			this.props.onReload(this.props.storageContext);
		});
	}

	getDirectoryUI(directory) {
		return (
			<div className="col-sm-6 col-xs-12 col-md-4" key={`directory${directory.id}`}>
				<div className="card card-block folder">
					<strong className="card-title-directory" onClick={this.handleOnDirectoryClick.bind(this, directory)}>
						<i className="fa fa-folder" aria-hidden="true"></i>
						{directory.name}
					</strong>
					<i className="fa fa-trash-o pull-right" aria-hidden="true" data-toggle="modal" data-target={`#deleteFolderModal${directory.id}`} onClick={this.preventEventPropagation}/>
				</div>
				{ this.getDirectoryDeleteModalUI(directory) }
			</div>
		);
	}

	getDirectoriesUI() {
		return (
			<div>
				{this.props.directories.map(d => {
					return this.getDirectoryUI(d);
				})}
				<NewDirectory {... this.props} />
			</div>
		);
	}

	getDirectoryDeleteModalUI(directory) {
		return (
			<div className="modal fade" id={`deleteFolderModal${directory.id}`} role="dialog" aria-labelledby="myModalLabel">
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span
								aria-hidden="true">&times;</span></button>
							<h4 className="modal-title" id="myModalLabel">Ordner löschen</h4>
						</div>
						<div className="modal-body">
							<p>Möchtest du diesen Ordner wirklich löschen?</p>
							<span>
								<button type="button" className="btn btn-default" data-dismiss="modal" aria-label="Close">
									Abbrechen
								</button>
								<button onClick={this.handleOnDeleteClick.bind(this, directory)} type="button" className="btn btn-primary" data-dismiss="modal" aria-label="Close">
									Löschen
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
