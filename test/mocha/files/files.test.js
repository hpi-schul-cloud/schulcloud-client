'use strict';

const assert = require('assert');
const app = require('../../../app');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const loginHelper = require('../helper/login-helper');
chai.use(chaiHttp);

describe('Files tests', function () {
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

    it('GET /files/', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/files/?lng=de')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Meine Dateien');
                    expect(res.text).to.contain('Meine persönlichen Dateien');
                    expect(res.text).to.contain('Meine Kurs-Dateien');
                    expect(res.text).to.contain('Meine Team-Dateien');
                    resolve();
                });
        });
    });

    it('GET /files/my/', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/files/my/?lng=de')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Dateien');
                    expect(res.text).to.contain('Dateien zum Hochladen ablegen.');
                    expect(res.text).to.contain('Meine persönlichen Dateien');
                    resolve();
                });
        });
    });

    it('GET /files/courses', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/files/courses/?lng=de')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Dateien aus meinen Kursen');
                    resolve();
                });
        });
    });

    it('GET /files/classes', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/files/classes/?lng=de')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Dateien aus meinen Klassen');
                    resolve();
                });
        });
    });
});
