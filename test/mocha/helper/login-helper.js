'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const login = (app) => {
    let agent = chai.request.agent(app); // create agent for storing cookies
    return new Promise((resolve, reject) => {
        agent
            .post('/login/')
            .send({'username': 'schueler@schul-cloud.org', 'password': process.env.SC_DEMO_USER_PASSWORD})
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
};

module.exports = {
    login
};