'use strict';

const assert = require('assert');
const { Configuration } = require('@schul-cloud/commons');
const app = require('../../../app');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const loginHelper = require('../helper/login-helper');
chai.use(chaiHttp);

describe('Content tests', function () {
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

    it('GET /content', function () {
		expect(Configuration.get('LERNSTORE_MODE'), 'LERNSTORE_MODE not set!').to.be.not.equal('DISABLED');
            return new Promise((resolve, reject) => {
                this.agent
                    .get('/content/')
                    .end((err, res) => {
                        expect(res.statusCode).to.equal(200);
                        expect(res.text).to.contain('Lern-Store');
                        resolve();
                    });
            });
    });

    it('GET /content/?q=Mathe', function () {
		expect(Configuration.get('LERNSTORE_MODE'), 'LERNSTORE_MODE not set!').to.be.not.equal('DISABLED');
            return new Promise((resolve, reject) => {
                this.agent
                    .get('/content/?q=Mathe')
                    .end((err, res) => {
                        expect(res.statusCode).to.equal(200);
                        expect(res.text).to.contain('Lern-Store');
                        expect(res.text).to.contain('Suchergebnisse für "Mathe"');
                        expect(res.text).not.to.contain('keine Ergebnisse');
                        resolve();
                    });
            });
    });
});
