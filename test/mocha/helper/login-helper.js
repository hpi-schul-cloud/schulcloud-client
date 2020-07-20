const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

const { SC_DEMO_USER_NAME, SC_DEMO_USER_PASSWORD } = require('../../../config/global');

const getLoginPage = (agent) => new Promise((resolve, reject) => {
	agent.get('/login/').end((err, res) => {
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

const extractCsrf = (string) => {
	if (!string) return undefined;
	let result = string.split('<meta name="csrfToken" content="', 2)[1];
	result = result.split('">', 2)[0];

	return result;
};

const getCsrfToken = (agent) => new Promise((resolve) => {
	getLoginPage(agent).then(({ res }) => {
		const csrf = extractCsrf(res.text);
		resolve({ csrf });
	});
});


const login = (app, user, pass) => {
	const agent = chai.request.agent(app); // create agent for storing cookies

	const userLogin = user || SC_DEMO_USER_NAME;
	const userPassword = pass || SC_DEMO_USER_PASSWORD;

	return new Promise((resolve, reject) => {
		getCsrfToken(agent).then(({ csrf }) => {
			agent
				.post('/login/')
				.redirects(2)
				.send({
					username: userLogin,
					password: userPassword,
					_csrf: csrf,
				})
				.end((err, res) => {
					if (err) {
						reject(err);
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
							'student-email': userLogin,
							'password-1': userPassword,
							'password-2': userPassword,
							_csrf: csrf,
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
	});
};

module.exports = {
	login,
};
