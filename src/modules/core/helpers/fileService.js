import { Permissions, Server, Notification } from '../../core/helpers/';

class FileService {
	constructor() {}

	getUrl(fileName, fileType, storageContext, action) {
		const s3SignedUrl = Server.service('/fileStorage/signedUrl');

		var data = {
			storageContext: storageContext,
			fileName: fileName,
			fileType: fileType,
			action: action
		};

		return s3SignedUrl.create(data)
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
		}).then(res => {
			return res;
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
}

export default new FileService();
