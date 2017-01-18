import { Link } from 'react-router';
import React from 'react';
import Dropzone from 'react-dropzone';
import request from 'superagent';
import axios from 'axios';
import { s3Service } from '../../core/helpers';
import { Server } from '../../core/helpers';
const signesURLservice

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
		var file = files[0];

		console.log(file);
		axios.get(ENDPOINT_TO_GET_SIGNED_URL, {
			filename: file.name,
			filetype: file.type
		})
			.then(function (result) {
				var signedUrl = result.data.signedUrl;

				var options = {
					headers: {
						'Content-Type': file.type
					}
				};

				return axios.put(signedUrl, file, options);
			})
			.then(function (result) {
				console.log(result);
			})
			.catch(function (err) {
				console.log(err);
			});
		}


	render() {
		return (
			<section className="section-upload">
				<div className="container-fluid">
					<div className="row">
						<Dropzone className="drop-zone"
							onDrop={ this._onDrop }
							maxSize={10000000}>
							<span><i className="fa fa-cloud-upload" /> Dateien zum Hochladen ablegen.</span>
						</Dropzone>
					</div>
				</div>
			</section>
		);
	}

}

export default Memory;
