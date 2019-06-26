"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const login = app => {
	let agent = chai.request.agent(app); // create agent for storing cookies

	return new Promise((resolve, reject) => {
		getCsrfToken(agent).then(csrf => {
			
			agent
				.post("/login/")
				.send({
					username: "schueler@schul-cloud.org",
                    password: process.env.SC_DEMO_USER_PASSWORD, 
                    _csrf: csrf
				})
				.end((err, res) => {
					if (err) {
						reject(err);
					}

					// return agent for making further request in loggedIn state
					resolve({
						agent,
						res
					});
				});
		});
	});
};

const getLoginPage = agent => {
	return new Promise((resolve, reject) => {
		agent.get("/login/").end((err, res) => {
			if (err) {
				reject(err);
			}

			// return agent for making further request in loggedIn state
			resolve({
				agent,
				res
			});
		});
	});
};

const extractCsrf = string => {
	if (!string) return undefined;
	let result = string.split('<meta name="csrfToken" content="', 2)[1];
	result = result.split('">', 2)[0];
	console.log(result);
	return result;
};

const getCsrfToken = agent => {
	return new Promise((resolve, reject) => {
		getLoginPage(agent).then(({ res }) => {
			let csrf = extractCsrf(res.text);
			if (csrf) {
				resolve(csrf);
			} else {
				reject(csrf);
			}
		});
	});
};

module.exports = {
	login
};
