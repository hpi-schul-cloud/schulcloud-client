'use strict';

const assert = require('assert');
const app = require('../../../app');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const loginHelper = require('../helper/login-helper');
chai.use(chaiHttp);

describe('Homework tests', function () {
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

    // OVERVIEW PAGES
    it('GET /homework', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Aufgaben');
                    expect(res.text).to.contain('Mathe');
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
                    expect(res.text).to.not.contain('btn btn-secondary btn-sm btn-edit');
                    expect(res.text).to.not.contain('btn btn-secondary btn-sm btn-delete');
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
                    expect(res.text).to.contain('Entwürfe');
                    expect(res.text).to.contain('btn btn-secondary btn-sm btn-edit');
                    expect(res.text).to.contain('btn btn-secondary btn-sm btn-delete');
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
    // DETAIL VIEW
    it('GET /homework/{users private task}', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/59cce1d381297026d02cdc4b')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain("Private Aufgabe von Marla");
                    resolve();
                });
        });
    });
    it('GET /homework/{users asked task}', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/59d1f63ce0a06325e8b5288b')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain("Aufgabe an Marla");
                    resolve();
                });
        });
    });
    it('GET /homework/{teachers private task}', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/59cce4c3c6abf042248e888e')
                .end((err, res) => {
                    expect(res.statusCode).to.not.equal(200);
                    expect(res.text).to.not.contain("Private Aufgabe von Cord");
                    resolve();
                });
        });
    });

    // CREATE & EDIT TASKS
    it('GET /homework/new', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/new')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Aufgabe hinzufügen');
                    resolve();
                });
        });
    });
    // users task
    it('GET /homework/{users task}/edit', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/59cce2c61113d1132c98dc06/edit')
                .end((err, res) => {
                    if(err) reject(err);
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Aufgabe bearbeiten');
                    resolve();
                });
        });
    });
    // teachers task
    it('GET /homework/{teachers task}/edit', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/59cce3f6c6abf042248e888d/edit')
                .end((err, res) => {
                    expect(res.statusCode).to.not.equal(200);
                    expect(res.text).to.not.contain('Aufgabe bearbeiten');
                    resolve();
                });
        });
    });
});
