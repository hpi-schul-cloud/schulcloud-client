const {
	KEEP_ALIVE = false,
	BACKEND_URL = 'http://localhost:3030/',
	EDITOR_URL = 'http://localhost:4001',
} = process.env;

module.exports = {
	KEEP_ALIVE,
	BACKEND_URL,
	EDITOR_URL,
};
