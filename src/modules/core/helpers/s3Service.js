var aws = require('aws-sdk');

class s3Service {
	constructor() {}


	geturl(filename, filetype){

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
			Bucket: 'bucket-test2',
			Key: filename,
			Expires: 60,
			ContentType: filetype
			};


		return s3.getSignedUrl('putObject', params);
	}
	getList(){
		var config = new aws.Config({
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
