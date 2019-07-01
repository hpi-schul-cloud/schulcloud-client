

const studentName = 'schueler@schul-cloud.org';
const password = process.env.SC_DEMO_USER_PASSWORD;

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

const login = (app) => {
	const agent = chai.request.agent(app); // create agent for storing cookies
	return new Promise((resolve, reject) => {
		agent
			.post('/login/')
			.send({ username: studentName, password })
			.end((err, res) => {
				if (err) {
					reject(err);
				}

				// return agent for making further request in loggedIn state
				resolve({
					agent,
					res,
				});
			});
	});
};

module.exports = {
	login,
};
