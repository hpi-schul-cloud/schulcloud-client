class s3Service {
	constructor() {}

	s3upload(){
		var fs = require('fs')
		var AWS = require('aws-sdk')

		var config = {
			s3ForcePathStyle: true,
			accessKeyId: 'ACCESS_KEY_ID',
			secretAccessKey: 'SECRET_ACCESS_KEY',
			endpoint: new AWS.Endpoint('service.langl.eu:3000')
		}

		var s3client = new AWS.S3(config)

		var params = {
			Key: 'Key',
			Bucket: 'Bucket',
			Body: fs.createReadStream('./image.png')
		}

		s3client.upload(params, function uploadCallback (err, data) {
			console.log(err, data)
		})
	}



}

export default new s3Service();
