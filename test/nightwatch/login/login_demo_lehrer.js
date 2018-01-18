const config = require('../../../nightwatch.conf.js');
const base_url = process.env.FRONTEND_URL || 'http://localhost:3100/';

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
            .setValue('input[name=username]', 'demo-lehrer@schul-cloud.org')
            .setValue('input[name=password]', 'schulcloud')
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
    'Schul-Cloud Visit Every Subpage': function (browser) {
        //News
        browser.url(base_url + 'news/');
        browser.expect.element('h4').text.to.contain('Neuigkeiten');

        //Courses
        browser.url(base_url + 'courses/');
        browser.expect.element('h4').text.to.contain('Meine Kurse');

        //Classes
        browser.url(base_url + 'classes/');
        browser.expect.element('h4').text.to.contain('Meine Klassen');

        //Calendar
        browser.url(base_url + 'calendar/');
        browser.expect.element('h4').text.to.contain('Kalender');

        //Homework
        browser.url(base_url + 'homework/');
        browser.expect.element('h4').text.to.contain('Aufgaben');

        browser.url(base_url + 'homework/asked/');
        browser.expect.element('h4').text.to.contain('Gestellte Aufgaben');

        browser.url(base_url + 'homework/private/');
        browser.expect.element('h4').text.to.contain('Meine Aufgaben');

        browser.url(base_url + 'homework/archive/');
        browser.expect.element('h4').text.to.contain('Archivierte Aufgaben');

        //Files
        browser.url(base_url + 'files/');
        browser.expect.element('h4').text.to.contain('Meine Dateien');

        browser.url(base_url + 'files/my/');
        browser.expect.element('h4').text.to.contain('Dateien');

        browser.url(base_url + 'files/courses/');
        browser.expect.element('h4').text.to.contain('Dateien');

        browser.url(base_url + 'files/shared/');
        browser.expect.element('h4').text.to.contain('Dateien');

        //Content
        browser.url(base_url + 'content/');
        browser.expect.element('h4').text.to.contain('Materialien');

        //Settings
        browser.url(base_url + 'account/');
        browser.expect.element('h4').text.to.contain('Dein Account');
    },
    'Schul-Cloud End': function (browser) {
        browser.end();
    }
};
