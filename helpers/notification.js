const defaults = require("../defaults");

const notificationParser = function (notification) {
	notification.seen = false;
	if (notification.seenCallback.length === 1) {
		notification.seen = true;
		notification.seenDate =
			notification.seenCallback[0].createdAt;
	} else {
		notification.seenUrl = new URL(
			"/notification/callback/" +
			notification._id.toString() +
			"?" +
			"receiverId=" +
			notification.receivers[0].userId.toString(),
			defaults.BACKEND_URL
		).toString();
	}
	notification.hasAuthor = false;
	if (notification.sender && notification.sender.name) {
		notification.author = notification.sender.name;
		notification.hasAuthor = true;
	}
	return notification;
}

module.exports = { notificationParser };
