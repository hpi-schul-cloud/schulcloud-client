import { Permissions, Server, Notification } from '../../core/helpers/';

class FileService {
	constructor() {}

	getUrl(fileName, fileType, storageContext, action) {
		const signedUrlService = Server.service('/fileStorage/signedUrl');

		var data = {
			storageContext: storageContext,
			fileName: fileName,
			fileType: fileType,
			action: action
		};

		return signedUrlService.create(data)
			.then((res) => {
				return res;
			})
			.catch((err) => {
				Notification.showError(err.message);
			});
	}

	getFileList(storageContext) {
		const fileStorageService = Server.service('/fileStorage');
		return fileStorageService.find({
			query: {
				storageContext: storageContext
			}
		}).catch(err => {
			Notification.showError(err.message);
		});
	}

	deleteFile(storageContext, fileName) {
		const fileStorageService = Server.service('/fileStorage');
		return fileStorageService.remove(null, {
			query: {
				storageContext: storageContext,
				fileName: fileName
			}
		});
	}

	createDirectory(storageContext, dirName) {
		const directoryService = Server.service('/fileStorage/directories');
		return directoryService.create({
			storageContext: storageContext,
			dirName: dirName
		});
	}

	deleteDirectory(storageContext, dirName) {
		const directoryService = Server.service('/fileStorage/directories');
		return directoryService.remove(null, {
			storageContext: storageContext,
			dirName: dirName
		});
	}
}

export default new FileService();
