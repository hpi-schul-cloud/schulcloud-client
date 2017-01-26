import axios from 'axios';
import {s3Service} from '../../core/helpers';
import { Permissions, Server } from '../../core/helpers/';

export default {
	upload: (files) => {
		const currentUser = Server.get('user');
		Promise.all(files.map((file) => {
			return s3Service.getUrl(file.name, file.type, `users/${currentUser._id}`, 'putObject')
				.then((signedUrl) => {
					var options = {
						headers: signedUrl.header
					};
					return axios.put(signedUrl.url, file, options);
				});
		})).then(res => {
			window.location.reload();
		});
	}
};
