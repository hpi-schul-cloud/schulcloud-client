'use strict';

const assert = require('assert');
const app = require('../../../app');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const loginHelper = require('../helper/login-helper');
chai.use(chaiHttp);

describe('Login tests', function () {
    before(function (done) {
        this.server = app.listen(3031);
        this.server.once('listening', () => done());
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
                    expect(res.text).to.contain('E-Mail / Nutzername');
                    expect(res.text).to.contain('Passwort');
                    resolve();
                });
        });
    });

    it("POST /login", function () {
        return loginHelper.login(app).then(result => {
            expect(result.res).to.redirect;
            expect(result.res.statusCode).to.equal(200);
            expect(result.res.text).to.contain('Übersicht');
            expect(result.res.text).to.contain('Marla Mathe');
            expect(result.res.text).to.contain('Schüler');
            return;
        });
    });
});
