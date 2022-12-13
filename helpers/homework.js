const _ = require('lodash');

function getGradingFileName(file) {
	return file.name;
}

function getGradingFileDownloadPath(file) {
	return `/api/v3/file/download/${file.id}/${encodeURIComponent(file.name)}`;
}

module.exports = {
	getGradingFileName,
	getGradingFileDownloadPath,
};
