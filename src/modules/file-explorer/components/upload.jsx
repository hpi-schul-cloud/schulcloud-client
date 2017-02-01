import React from 'react';
import Dropzone from 'react-dropzone';

require('../styles/upload.scss');

class Memory extends React.Component {

	constructor(props) {
		super(props);

		this.state = {uploadingFiles: {}};
	}

	updateProgress(file, progress) {
		let uploadingFiles = this.state.uploadingFiles;
		if(progress == 100) {
			delete uploadingFiles[file.name];
		} else {
			uploadingFiles[file.name] = file;
			uploadingFiles[file.name].progress = progress;
		}
		this.setState({uploadingFiles});
	}

	render() {
		return (
			<section className="section-upload">
				<div className="container-fluid">
					<div className="row">
						<Dropzone className="drop-zone"
								  onDrop={this.props.actions.upload.bind(null, this.updateProgress.bind(this)) }
								  maxSize={1024 * 1024 * 100000}>
							<span><i className="fa fa-cloud-upload"/> Dateien zum Hochladen ablegen.</span>
						</Dropzone>
						{Object.keys(this.state.uploadingFiles).map(key => {
							const file = this.state.uploadingFiles[key];
							return  <a> {file.name} wird hochgeladen: {file.progress}% <br/></a>
						})}
					</div>
				</div>
			</section>
		);
	}

}

export default Memory;
