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
            .setValue('input[name=username]', 'demo-schueler@schul-cloud.org')
            .setValue('input[name=password]', 'schulcloud')
            .waitForElementVisible('input[type=submit]', 1000)
            .click('input[type=submit]')
            .pause(1000);
    },
    'Schul-Cloud Checkups': function (browser) {
        browser.expect.element('h4').text.to.contain('Übersicht').before(10000);
        browser.expect.element('h5').text.to.contain('Stundenplan').before(10000);
        browser.setCookie({
            name: "releaseDate",
            value: "9999-12-09T16:36:20.000Z",
            path: "/"
        });
    },
    'Schul-Cloud Visit Every Subpage': function (browser) {
        //News
        browser.url(base_url + 'news/');
        browser.expect.element('h4').text.to.contain('Neuigkeiten').before(10000);

        //Courses
        browser.url(base_url + 'courses/');
        browser.expect.element('h4').text.to.contain('Meine Kurse').before(10000);

        //Classes
        browser.url(base_url + 'classes/');
        browser.expect.element('h4').text.to.contain('Meine Klassen').before(10000);

        //Calendar
        browser.url(base_url + 'calendar/');
        browser.expect.element('h4').text.to.contain('Kalender').before(10000);

        //Homework
        browser.url(base_url + 'homework/');
        browser.expect.element('h4').text.to.contain('Aufgaben').before(10000);

        browser.url(base_url + 'homework/asked/');
        browser.expect.element('h4').text.to.contain('Gestellte Aufgaben').before(10000);

        browser.url(base_url + 'homework/private/');
        browser.expect.element('h4').text.to.contain('Meine Aufgaben').before(10000);

        browser.url(base_url + 'homework/archive/');
        browser.expect.element('h4').text.to.contain('Archivierte Aufgaben').before(10000);

        //Files
        browser.url(base_url + 'files/');
        browser.expect.element('h4').text.to.contain('Meine Dateien').before(10000);

        browser.url(base_url + 'files/my/');
        browser.expect.element('h4').text.to.contain('Dateien').before(10000);

        browser.url(base_url + 'files/courses/');
        browser.expect.element('h4').text.to.contain('Dateien').before(10000);

        browser.url(base_url + 'files/shared/');
        browser.expect.element('h4').text.to.contain('Dateien').before(10000);

        //Content
        browser.url(base_url + 'content/');
        browser.expect.element('h4').text.to.contain('Materialien').before(10000);

        //Settings
        browser.url(base_url + 'account/');
        browser.expect.element('h4').text.to.contain('Dein Account').before(10000);
    },
    'Schul-Cloud End': function (browser) {
        browser.end();
    }
};
