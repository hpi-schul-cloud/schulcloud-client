import axios from 'axios';
import {FileService} from '../../core/helpers';
import {Permissions, Server, Notification} from '../../core/helpers/';

const saveFile = (url, fileName) => {
	var options = {
		responseType: 'blob'
	};

	axios.get(url, options).then(res => {
		var a = document.createElement('a');
		a.href = window.URL.createObjectURL(res.data);
		a.download = fileName;
		a.style.display = 'none';
		document.body.appendChild(a);
		a.click();
	});
};

export default {
	upload: (files, storageContext) => {
		const currentUser = Server.get('user');
		return Promise.all(files.map((file) => {
			return FileService.getUrl(file.name, file.type, storageContext, 'putObject')
				.then((signedUrl) => {
					var options = {
						headers: signedUrl.header
					};
					return axios.put(signedUrl.url, file, options);
				});
		})).then(res => {
			return res;
		}).catch(err => Notification.showError(err));
	},

	download: (file, storageContext) => {
		const currentUser = Server.get('user');
		return FileService.getUrl(file.name, null, storageContext, 'getObject')
			.then((signedUrl) => {
				if (!signedUrl.url) {
					Notification.showError("Beim Downloaden der Datei ist etwas schief gelaufen!");
					return;
				}

				saveFile(signedUrl.url, file.name);
			}).catch(err => {
				Notification.showError(err.message);
			});
	},

	delete: (file, storageContext) => {
		const currentUser = Server.get('user');
		return FileService.deleteFile(storageContext, file.name, null)
			.then((res) => {
				return res;
			}).catch(err => {
				Notification.showError(err.message);
			});
	}
};
