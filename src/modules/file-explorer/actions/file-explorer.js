import axios from 'axios';
import {FileService} from '../../core/helpers';
import {Permissions, Server, Notification} from '../../core/helpers/';
require('../../../static/images/.scfake.png');

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
	upload: (progressCallback, files, storageContext) => {
		return Promise.all(files.map((file) => {
			const fileType = file.type || "application/octet-stream";
			return FileService.getUrl(file.name, fileType, storageContext, 'putObject')
				.then((signedUrl) => {
					var options = {
						headers: signedUrl.header,
						onUploadProgress: function(progressEvent) {
							const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
							progressCallback(file, percentCompleted);
						}
					};
					return axios.put(signedUrl.url, file, options);
				});
		})).then(res => {
			return res;
		}).catch(err => Notification.showError(err));
	},

	download: (file, storageContext) => {
		return FileService.getUrl(file.name, null, storageContext, 'getObject')
			.then((signedUrl) => {
				if (!signedUrl.url) {
					Notification.showError("Beim Downloaden der Datei ist etwas schief gelaufen!");
					return;
				}

				window.saveFile(signedUrl.url, file.name);
				
			}).catch(err => {
				Notification.showError(err.message);
			});
	},

	open: (file, storageContext) => {
        return FileService.getUrl(file.name, null, storageContext, 'getObject')
            .then((signedUrl) => {
                if (!signedUrl.url) {
                    Notification.showError("Beim Anzeigen der Datei ist etwas schief gelaufen!");
                    return;
                }
                window.open(signedUrl.url);
            }).catch(err => {
                Notification.showError(err.message);
            });
    },

	delete: (file, storageContext) => {
		return FileService.deleteFile(storageContext, file.name, null)
			.then((res) => {
				return res;
			}).catch(err => {
				Notification.showError(err.message);
			});
	},

	createNewFolder: (dirName, storageContext) => {
		return FileService.createDirectory(storageContext, dirName);
	}
};
