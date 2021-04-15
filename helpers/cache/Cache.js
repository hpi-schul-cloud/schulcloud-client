class Cache {
	constructor(callback, { updateInvervalSecounds } = {}) {
		this.lastUpdated = 0;
		this.updateInvervalSecounds = (updateInvervalSecounds * 1000) || 60000;
		this.data = null;
		if (!(typeof callback === 'function')) {
			throw new Error('First parameter in "Cache" constructor must be a function.');
		}
		this.callback = callback;
	}

	async get(req, res, next) {
		if (Date.now() > (this.lastUpdated + this.updateInvervalSecounds)) {
			// please first update time and response old data until request return result
			this.lastUpdated = Date.now();
			this.data = this.callback(req, res, next);
		}
		return this.data;
	}

	clear() {
		this.data = null;
		this.lastUpdated = 0;
	}
}

module.exports = Cache;
