import axios from 'axios';
import {FileService} from '../../core/helpers';
import {Permissions, Server, Notification} from '../../core/helpers/';

const saveFile = (progressCallback, url, fileName) => {
	var options = {
		responseType: 'blob',
		onDownloadProgress: function (progressEvent) {
			const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
			progressCallback(fileName, percentCompleted);
		}
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
	upload: (progressCallback, files) => {
		const currentUser = Server.get('user');
		return Promise.all(files.map((file) => {
			return FileService.getUrl(file.name, file.type, `users/${currentUser._id}`, 'putObject')
				.then((signedUrl) => {
					var options = {
						headers: signedUrl.header,
						onUploadProgress: function(progressEvent) {
							const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
							progressCallback(file, percentCompleted);
						}
					};
					return axios.put(signedUrl.url, file, options)
				});
		})).then(res => {
			return res;
		}).catch(err => Notification.showError(err));
	},

	download: (progressCallback, file) => {
		const currentUser = Server.get('user');
		return FileService.getUrl(file.name, null, `users/${currentUser._id}`, 'getObject')
			.then((signedUrl) => {
				if (!signedUrl.url) {
					Notification.showError("Beim Downloaden der Datei ist etwas schief gelaufen!");
					return;
				}

				saveFile(progressCallback, signedUrl.url, file.name);
			}).catch(err => {
				Notification.showError(err.message);
			});
	},

	delete: (file) => {
		const currentUser = Server.get('user');
		return FileService.deleteFile(`users/${currentUser._id}`, file.name, null)
			.then((res) => {
				return res;
			}).catch(err => {
				Notification.showError(err.message);
			});
	}
};
