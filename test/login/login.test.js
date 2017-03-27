'use strict';

const assert = require('assert');
const app = require('../../app');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

describe('Login tests', function () {
    before(function (done) {
        this.server = app.listen(3031);
        this.server.once('listening', () => done());
        this.agent = chai.request.agent(app); // create agent for storing cookies
    });

    after(function (done) {
        this.server.close(done);
    });

    it('GET /login', function () {
        return new Promise((resolve, reject) => {
            chai.request(app)
                .get('/login/')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Schul-Cloud');
                    expect(res.text).to.contain('Email-Adresse oder Nutzername');
                    expect(res.text).to.contain('Passwort');
                    resolve();
                });
        });
    });
    
    it("POST /login", function () {
        return new Promise((resolve, reject) => {
            this.agent
                .post('/login/')
                .send({'username': 'schueler@schul-cloud.org', 'password': process.env.SC_DEMO_USER_PASSWORD})
                .end((err, res) => {
                    expect(res).to.redirect;
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Übersicht');
                    expect(res.text).to.contain('Ida Renz');
                    expect(res.text).to.contain('Schüler');
                    resolve();
                });
        });
    });
});
