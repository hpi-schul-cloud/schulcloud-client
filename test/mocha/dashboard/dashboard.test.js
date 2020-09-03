'use strict';

const assert = require('assert');
const app = require('../../../app');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const loginHelper = require('../helper/login-helper');
chai.use(chaiHttp);

describe('Dashboard tests', function () {
    before(function (done) {
        this.server = app.listen(3031);
        this.server.once('listening', () => {
            loginHelper.login(app).then(res => {
                this.agent = res.agent;
                done();
            });
        });
    });

    after(function (done) {
        this.server.close(done);
    });

    it('GET /dashboard', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/dashboard/')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Übersicht');
                    expect(res.text).to.contain('Marla Mathe');
                    expect(res.text).to.contain('Schüler');
                    resolve();
                });
        });
    });

    it('GET /dashboard redirect to login if not logged in', function () {
        return new Promise((resolve, reject) => {
            chai.request(app)
                .get('/dashboard/')
                .end((err, res) => {
                    expect(res).to.redirect;
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Login');
                    expect(res.text).to.contain('Mehr Optionen');
                    resolve();
                });
        });
    });
});
