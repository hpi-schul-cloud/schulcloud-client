import fs from 'fs';

class Config {
	constructor(env) {
		const config = this.config();
		return config[env];
	}

	config() {
		return {
			local: {
				server: 'http://localhost:3030'
			},
			staging: {
				server: 'https://school.langl.eu:3030'
			},
			production: {
				server: 'https://schul-cloud.org'
			}
		};
	}
}

export default new Config(process.env.ENV);
