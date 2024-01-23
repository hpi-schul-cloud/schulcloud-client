const api = require('../api');

const downloadAsPdf = (res, fileData, fileTitle) => {
	// ERR_INVALID_CHAR will get thrown on ukrainian translation without encoding
	const encodedFileTitle = encodeURI(fileTitle);
	const download = Buffer.from(fileData, 'base64');
	res.writeHead(200, {
		'Content-Type': 'application/pdf',
		'Content-Disposition': `attachment; filename="${encodedFileTitle}.pdf"`,
	}).end(download);
};

const getBase64File = async (req, res, fileId, fileTitle) => {
	if (fileId) {
		const base64File = await api(req).get(`/base64Files/${fileId}`);
		if (base64File.data) {
			const fileData = base64File.data.replace(
				'data:application/pdf;base64,',
				'',
			);
			downloadAsPdf(res, fileData, fileTitle);
		}
	}
};

module.exports = {
	getBase64File,
};
