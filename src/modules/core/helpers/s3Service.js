import { Permissions, Server, Notification } from '../../core/helpers/';

class s3Service {
	constructor() {}

	getUrl(fileName, fileType, storageContext) {
		const s3SignedUrl = Server.service('/fileStorage/signedUrl');

		var data = {
			storageContext: storageContext,
			fileName: fileName,
			fileType: fileType
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
		const currentUser = Server.get('user');
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
}

export default new s3Service();
