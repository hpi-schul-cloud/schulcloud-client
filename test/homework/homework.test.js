'use strict';

const assert = require('assert');
const app = require('../../app');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const loginHelper = require('../helper/login-helper');
chai.use(chaiHttp);

describe('Homework tests', function () {
    this.timeout(10000);
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

    it('GET /homework', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Aufgaben');
                    resolve();
                });
        });
    });

    it('GET /homework/asked', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/asked')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Gestellte Aufgaben');
                    resolve();
                });
        });
    });

    it('GET /homework/private', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/private')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Meine Aufgaben');
                    resolve();
                });
        });
    });

    it('GET /homework/archive', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/archive')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Archivierte Aufgaben');
                    expect(res.text).to.contain('Keine Aufgaben.');
                    resolve();
                });
        });
    });
});
