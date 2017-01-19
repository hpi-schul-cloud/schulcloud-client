import {Link} from 'react-router';
import React from 'react';
import Dropzone from 'react-dropzone';
import request from 'superagent';
import axios from 'axios';
import {s3Service} from '../../core/helpers';
import {Server} from '../../core/helpers';
/*const signesURLservice;*/

require('../styles/upload.scss');

class Memory extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	/* Mock data */
	getData() {
		return [{}];
	}

	_onDrop(files) {

		for(var i = 0; i<files.length; i++) {
			var signedUrl = s3Service.geturl(files[i].name, files[i].type, "users");
			console.log(signedUrl);
			var options = {
				headers: {
					'Content-Type': files[i].type,
					'Access-Control-Allow-Origin': '*'
				}
			};

			axios.put(signedUrl, files[i], options);
		}
	}

	render() {
		return (
			<section className="section-upload">
				<div className="container-fluid">
					<div className="row">
						<Dropzone className="drop-zone"
								  onDrop={ this._onDrop }
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
