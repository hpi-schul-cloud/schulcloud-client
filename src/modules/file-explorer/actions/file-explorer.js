import axios from 'axios';
import {FileService} from '../../core/helpers';
import {Permissions, Server, Notification} from '../../core/helpers/';

window.saveFile = function (url, fileName) {
		//iOS devices not supported
	if (/(iP)/g.test(navigator.userAgent)) {
		Notification.showError('Dein Gerät unterstützt das Herunterladen nicht. Bitte benutze einen Desktop Browser.');
		return false;
	}

	//If in Chrome or Safari - download via virtual link click
	if ((navigator.userAgent.toLowerCase().indexOf('chrome') > -1) || (navigator.userAgent.toLowerCase().indexOf('safari') > -1)) {
		//new link node.
		var link = document.createElement('a');
		link.href = url;

		if (link.download !== undefined) {
			//Set HTML5 download attribute, will prevent file from opening if supported.
			link.download = fileName;
		}

		//Dispatching click event.
		if (document.createEvent) {
			var e = document.createEvent('MouseEvents');
			e.initEvent('click', true, true);
			link.dispatchEvent(e);
			return true;
		}
	}

	// Force file download (whether supported by server).
	if (url.indexOf('?') === -1) {
		url += '?download';
	}

	window.open(url, '_self');
	return true;
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

	download: (file) => {
		const currentUser = Server.get('user');
		return FileService.getUrl(file.name, null, `users/${currentUser._id}`, 'getObject')
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
