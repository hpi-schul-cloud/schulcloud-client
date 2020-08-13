const _ = require('lodash');

function isGraded(submission) {
	return typeof submission.grade === 'number' || !!submission.gradeComment || !_.isEmpty(submission.gradeFileIds);
}

function getGradingFileName(file) {
	const parts = file.name.split('.');
	const creationDate = file.createdAt.slice(0, 10);
	const baseName = parts.slice(0, -1).join('.');
	const fileEnding = _.last(parts);
	return `${creationDate}_${baseName}_${file._id}.${fileEnding}`;
}

function getGradingFileDownloadPath(file) {
	return `/files/file?download=true&file=${file._id}&name=${encodeURIComponent(getGradingFileName(file))}`;
}

module.exports = {
	isGraded,
	getGradingFileName,
	getGradingFileDownloadPath,
};
