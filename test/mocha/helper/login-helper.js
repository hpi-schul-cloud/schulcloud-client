const studentName = 'schueler@schul-cloud.org';
const password = process.env.SC_DEMO_USER_PASSWORD || 'Schulcloud1!';

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);


const getLoginPage = agent => new Promise((resolve, reject) => {
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

const getCsrfToken = agent => new Promise((resolve) => {
	getLoginPage(agent).then(({ res }) => {
		const csrf = extractCsrf(res.text);
		resolve({ csrf });
	});
});


const login = (app) => {
	const agent = chai.request.agent(app); // create agent for storing cookies

	return new Promise((resolve, reject) => {
		getCsrfToken(agent).then(({ csrf }) => {
			agent
				.post('/login/')
				.redirects(2)
				.send({
					username: studentName,
					password,
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
							'student-email': studentName,
							'password-1': password,
							'password-2': password,
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
