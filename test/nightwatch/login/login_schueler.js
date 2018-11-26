const base_url = process.env.FRONTEND_URL || 'http://localhost:3100/';
const student_name = process.env.STUDENT_NAME || 'schueler@schul-cloud.org';
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
            .setValue('input[name=username]', student_name)
            .setValue('input[name=password]', password)
            .waitForElementVisible('input[type=submit]', 1000)
            .click('input[type=submit]')
            .pause(1000);
    },
    'Schul-Cloud Checkups': function (browser) {

        browser.expect.element('#titlebar h4#page-title').text.to.contain('Übersicht').before(10000);
        browser.expect.element('#main-content > section.section-timetable > div.row > div > h5').text.to.contain('Stundenplan').before(10000);
        browser.setCookie({
            name: "releaseDate",
            value: "9999-12-09T16:36:20.000Z",
            path: "/"
        });
    },
    'Schul-Cloud Visit Every Subpage': function (browser) {
        //News
        browser.url(base_url + 'news/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Neuigkeiten').before(10000);

        //Courses
        browser.url(base_url + 'courses/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Meine Kurse').before(10000);

        //Calendar
        browser.url(base_url + 'calendar/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Kalender').before(10000);

        //Homework
        browser.url(base_url + 'homework/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Aufgaben').before(10000);

        browser.url(base_url + 'homework/asked/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Gestellte Aufgaben').before(10000);

        browser.url(base_url + 'homework/private/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Meine ToDos').before(10000);

        browser.url(base_url + 'homework/archive/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Archivierte Aufgaben und ToDos').before(10000);

        //Files
        browser.url(base_url + 'files/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Meine Dateien').before(10000);

        browser.url(base_url + 'files/my/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Dateien').before(10000);

        browser.url(base_url + 'files/courses/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Dateien').before(10000);

        browser.url(base_url + 'files/shared/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Dateien').before(10000);

        //Content
        browser.url(base_url + 'content/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('LernStore').before(10000);

        //Settings
        browser.url(base_url + 'account/');
        browser.expect.element('#titlebar h4#page-title').text.to.contain('Dein Profil').before(10000);
    },
    'Schul-Cloud End': function (browser) {
        browser.end();
    }
};
