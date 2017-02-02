import React from 'react';
import Dropzone from 'react-dropzone';

require('../styles/upload.scss');

class Memory extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	handleOnDrop(files) {
		this.props.actions.upload(files).then(res => {
			this.props.onReload();
		});
	}

	render() {
		return (
			<section className="section-upload">
				<div className="container-fluid">
					<div className="row">
						<Dropzone className="drop-zone"
								  onDrop={ this.handleOnDrop.bind(this) }
								  maxSize={1024 * 1024 * 1000}>
							<span><i className="fa fa-cloud-upload"/> Dateien zum Hochladen ablegen.</span>
						</Dropzone>
					</div>
				</div>
			</section>
		);
	}

}

export default Memory;
