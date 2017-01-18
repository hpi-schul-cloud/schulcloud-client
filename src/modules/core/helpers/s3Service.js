var aws = require('aws-sdk');

class s3Service {
	constructor() {}


	s3upload(filename, filetype){

		console.log(filename, filetype);
		var config = new aws.Config({
			accessKeyId: "1234",
			secretAccessKey: "1234",
			region: "eu-west-1",
			endpoint: new aws.Endpoint("http://service.langl.eu:3000")
		});

		var s3 = new aws.S3(config);

		var params = {
			Bucket: 'Bucket',
			Key: filename,
			Expires: 60,
			ContentType: filetype
			};

		s3.createBucket({ Bucket: 'test' }, function(err, data) {
			if (err) {
				console.log("Error", err);
			} else {
				console.log("Success", data.Location);
			}
		});


		s3.getSignedUrl('putObject', params, function(err, data) {
			if (err) {
				console.log(err);
				return err;
			} else {
				console.log('The URL is', data);
				return data;
			}
		});
	}
}

export default new s3Service();
