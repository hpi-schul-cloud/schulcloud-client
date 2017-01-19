import { Permissions, Server } from '../../core/helpers/';

var aws = require('aws-sdk');
//const s3Service = Server.service('/fileStorage');

class s3Service {
	constructor() {}

	geturl(filename, filetype, path){
		const s3SignedUrl = Server.service('/fileStorage/signedUrl');
		const currentUser = Server.get('user');

		console.log(s3SignedUrl);

		path = path + '/' + currentUser._id;

		var data = {
			storageContext: path,
			fileName: filename,
			fileType: filetype
		};

		return s3SignedUrl.create(data)
			.then((response) => {
				console.log(response);
			});
		//return s3SignedUrl.create(data);
	}
	getList(){
		var config = new aws.Config({
			signatureVersion: "v4",
			s3ForcePathStyle: true,
			accessKeyId: "schulcloud",
			secretAccessKey: "schulcloud",
			region: "eu-west-1",
			endpoint: new aws.Endpoint("http://service.langl.eu:3000")
		});

		var s3 = new aws.S3(config);

		var params = {
			Bucket: 'bucket-test2'
		};



		s3.listObjects(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
			} else {
				return data;
			}
		});
	}
}

export default new s3Service();
