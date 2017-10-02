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
                    expect(res.text).to.contain('Meine Aufgaben');
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
    
    // CREATE & EDIT TASKS
    it('GET /homework/new', function () {
        return new Promise((resolve, reject) => {
            this.agent
                .get('/homework/archive')
                .end((err, res) => {
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain('Aufgabe hinzufügen');
                    expect(res.text).to.contain('Titel');
                    expect(res.text).to.contain('Kurs');
                    expect(res.text).to.contain('Thema');
                    expect(res.text).to.contain('Aufgabenstellung');
                    expect(res.text).to.contain('Bearbeitungszeit');
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
                    expect(res.statusCode).to.equal(200);
                    expect(res.text).to.contain("Private Aufgabe von Ida - mit Kurs, abgelaufen");
                    expect(res.text).to.contain("<span>Mathe</span>");
                    expect(res.text).to.contain("<p>Aufgabenbeschreibung</p>");
                    expect(res.text).to.contain('value="20.09.2016 13:00"');
                    expect(res.text).to.contain('value="28.07.2017 15:00"');
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
                    expect(res.text).to.not.contain("Aufgabe an Ida (Mathe) - offen");
                    resolve();
                });
        });
    });
});
