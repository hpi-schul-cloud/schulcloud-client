const config = require('../../nightwatch.conf.js');
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
    'Create News': function (browser) {
        browser.url(base_url + 'news/');
        browser.expect.element('h4').text.to.contain('Neuigkeiten');
        browser
            .click('.create')
            .pause(1000)
            .setValue('input[name=title]', 'Test News')
            .execute(
                function () {
                    CKEDITOR.instances["content"].setData('Lorem Ipsum');
                }
            )
            .click('.btn-submit')
            .pause(1000);
        browser.useXpath().expect.element("//*[contains(text(), 'Lorem Ipsum')]").text.to.contain('Lorem Ipsum');
    },
    'Delete News': function (browser) {
        browser.useXpath().click("//*[contains(text(), 'Test News')]");
        browser.useCss()
            .click('.btn-delete')
            .waitForElementVisible('.delete-modal')
            .waitForElementVisible('.btn-submit', 1000)
            .click('.btn-submit')
            .pause(1000);
    },
    'Schul-Cloud End': function (browser) {
        browser.end();
    }
};
