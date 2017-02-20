import React from 'react';
import Dropzone from 'react-dropzone';
import {RandomIdGenerator} from '../../core/helpers';
require('../styles/upload.scss');

class Upload extends React.Component {

	constructor(props) {
		super(props);

		this.state = {uploadingFiles: {}};
	}

	updateProgress(file, progress) {
		let uploadingFiles = this.state.uploadingFiles;
		if (progress == 100) {
			delete uploadingFiles[file.name];
		} else {
			uploadingFiles[file.name] = file;
			uploadingFiles[file.name].progress = progress;
		}
		this.setState({uploadingFiles});
	}

	handleOnDrop(files) {
		this.props.actions.upload(this.updateProgress.bind(this), files, this.props.storageContext).then(res => {
			this.props.onReload(this.props.storageContext, this.props.scopes);
		});
	}

	getProgressUI(file) {
		return (
			<div className="progress" key={RandomIdGenerator.generateRandomId()}>
				<span className="percent">{file.progress}%</span>
				<div className="name">{file.name}</div>
				<div className="bar" style={{width:file.progress +'%'}}>&nbsp;</div>
			</div>)
	}

	render() {
		return (
			<section className="section-upload">
				<div className="container-fluid">
					<div className="row">
						<Dropzone className="drop-zone"
								  maxSize={1024 * 1024 * 100000}
								  onDrop={ this.handleOnDrop.bind(this) }>
							<span><i className="fa fa-cloud-upload"/> Dateien zum Hochladen ablegen.</span>
						</Dropzone>
						<div className="progress-bar">
							{Object.keys(this.state.uploadingFiles).map(key => {
								const file = this.state.uploadingFiles[key];
								return this.getProgressUI(file);
							})}
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default Upload;
