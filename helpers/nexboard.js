const rp = require('request-promise');
const DEFAULT_BASE_URL = 'https://nexboard.nexenio.com/portal/api/v1/public/';

class Nexboard {
	constructor(apiKey, userID, url) {
		this.apiKey = apiKey;
		this.user = userID;
		this.url = url || DEFAULT_BASE_URL;
	}

	getProjectsIds() {
		const settings = {
			method: 'GET',
			uri: `${this.url}projects`,
			qs: {
				userId: this.user,
				token: this.apiKey,
			},
			json: true,
		};

		return rp(settings)
			.then((res) => res.map((e) => e.id))
			.catch((err) => Promise.reject(new Error(`Could not retrieve ProjectIds - ${err.error.msg}`)));
	}

	createProject(title, description) {
		const settings = {
			method: 'POST',
			uri: `${this.url}projects`,
			qs: {
				token: this.apiKey,
				userId: this.user,
			},
			body: {
				title,
				description,
			},
			headers: { "Content-Type": 'application/json' },
			json: true,
		};

		return rp(settings)
			.then((res) => res)
			.catch((err) => Promise.reject(new Error(`Could not create new Project - ${err.error.msg}`)));
	}

	getBoardsByProject(projectId) {
		const settings = {
			method: 'GET',
			uri: `${this.url}projects/${projectId}/boards`,
			qs: {
				userId: this.user,
				token: this.apiKey,
			},
			json: true,
		};

		return rp(settings)
			.then((res) => res)
			.catch((err) => Promise.reject(new Error(`Could not retrieve Boards from Projcet - ${err.error.msg}`)));
	}

	getBoard(boardId) {
		const settings = {
			method: 'GET',
			uri: `${this.url}boards/${boardId}`,
			qs: { token: this.apiKey },
			json: true,
		};

		return rp(settings)
			.then((res) => res)
			.catch((err) => Promise.reject(new Error(`Could not retrieve Board - ${err.error.msg}`)));
	}

	createBoard(title, description, project, email) {
		const settings = {
			method: 'POST',
			uri: `${this.url}boards`,
			qs: { token: this.apiKey },
			body: {
				title,
				description,
				email,
				projectId: project,
			},
			headers: { "Content-Type": 'application/json' },
			json: true,
		};

		return rp(settings)
			.then((res) => res)
			.catch((err) => Promise.reject(new Error(`Could not create a new Board - ${err.error.msg}`)));
	}
}

module.exports = Nexboard;
