// jshint esversion: 8

const { Configuration } = require('@hpi-schul-cloud/commons');
const { userHasPermission } = require('./permissions');

function makeNextcloudFolderName(teamId, teamName) {
	return `${teamName} (${teamId})`;
}

function useNextcloudFilesystem(user) {
	return Configuration.get('FEATURE_NEXTCLOUD_TEAM_FILES_ENABLED') === true
		&& userHasPermission(user, 'NEXTCLOUD_USER');
}

module.exports = {
	makeNextcloudFolderName,
	useNextcloudFilesystem,
};
