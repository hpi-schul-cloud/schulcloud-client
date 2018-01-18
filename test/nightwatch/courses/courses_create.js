const config = require('../../../nightwatch.conf.js');
const base_url = process.env.FRONTEND_URL || 'http://localhost:3100/';
const teacher_name = process.env.TEACHER_NAME || 'lehrer@schul-cloud.org';
const password = process.env.PASSWORD || "schulcloud";

module.exports = {
    'Schul-Cloud Reachable': function (browser) {
        browser
            .url(base_url + 'login/')
            .waitForElementVisible('body', 1000);
    },
    'Schul-Cloud Visibility': function (browser) {
        browser.expect.element('input[name=username]').to.be.visible;
        browser.expect.element('input[name=password]').to.be.visible;
    },
    'Schul-Cloud Login': function (browser) {
        browser
            .setValue('input[name=username]', teacher_name)
            .setValue('input[name=password]', password)
            .waitForElementVisible('input[type=submit]', 1000)
            .click('input[type=submit]')
            .pause(1000);
    },
    'Schul-Cloud Checkups': function (browser) {
        browser.expect.element('h4').text.to.contain('Übersicht');
        browser.expect.element('h5').text.to.contain('Stundenplan');
        browser
            .waitForElementVisible('.feature-modal', false)
            .click('button[type=button]');
    },
    'Create Course': function (browser) {
        browser.url(base_url + 'courses/');
        browser.expect.element('h4').text.to.contain('Meine Kurse');
        browser
            .click('.btn-add')
            .pause(1000)
            .setValue('input[name=name]', 'Test Kurs')
            .setValue('textarea[name=description]', 'Test Beschreibung')
            .click('.btn-submit')
            .pause(1000);
        browser.useXpath().expect.element("//*[contains(text(), 'Test Beschreibung')]").text.to.contain('Test Beschreibung');
    },
    'Delete Course': function (browser) {
        browser.useXpath().click("//*[contains(text(), 'Test Kurs')]");
        browser.useCss()
            .click('.btn-delete-course')
            .waitForElementVisible('.delete-modal')
            .waitForElementVisible('.btn-submit', 1000)
            .click('.btn-submit')
            .pause(1000);
    },
    'Schul-Cloud End': function (browser) {
        browser.end();
    }
};
