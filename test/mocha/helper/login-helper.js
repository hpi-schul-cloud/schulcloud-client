

const studentName = process.env.STUDENT_NAME || 'schueler@schul-cloud.org';
const password = process.env.PASSWORD || 'Schulcloud1!';

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
