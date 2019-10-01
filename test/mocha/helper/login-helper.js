const studentName = 'schueler@schul-cloud.org';
const password = process.env.SC_DEMO_USER_PASSWORD || 'Schulcloud1!';

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
					return reject(err);
				}
				if (!res.text.includes('/firstLogin/submit')) {
					// return agent for making further request in loggedIn state
					return resolve({
						agent,
						res,
					});
				}
				// do firstLogin if needed
				return agent
					.post('/firstLogin/submit')
					.send({
						'student-email': studentName,
						'password-1': password,
						'password-2': password,
					})
					.end((err, resFirstLogin) => {
						if (err) {
							return reject(err);
						}
						// return agent for making further request in loggedIn state
						return resolve({
							agent,
							res: resFirstLogin,
						});
					});
			});
	});
};

module.exports = {
	login,
};
