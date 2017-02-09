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

	getDirectoryUI(directory) {
		return (
			<div className="col-sm-6 col-xs-12 col-md-4" key={`directory${directory.id}`} onClick={this.handleOnDirectoryClick.bind(this, directory)}>
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
				<NewDirectory {... this.props} />
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
