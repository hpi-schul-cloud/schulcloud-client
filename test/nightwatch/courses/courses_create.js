const base_url = process.env.FRONTEND_URL || 'http://localhost:3100/';
const teacher_name = process.env.TEACHER_NAME || 'lehrer@schul-cloud.org';
const password = process.env.PASSWORD || "Schulcloud1!";

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
        browser.setCookie({
            name: "releaseDate",
            value: "9999-12-09T16:36:20.000Z",
            path: "/"
        });
    },
    'Create Course': function (browser) {
        browser.url(base_url + 'courses/');
        browser.expect.element('h4').text.to.contain('Meine Kurse').before(10000);
        browser.useXpath().moveToElement('//*[@id="main-content"]/section/div/div/div/div', 10, 10)
            .useCss()
            .click('.btn-add')
            .pause(1000)
            .setValue('input[name=name]', 'Test Kurs')
            .setValue('input[name=startDate]', '01.01.2019')
            .setValue('input[name=untilDate]', '01.03.2019')
            .moveToElement('#nextSection', 10, 10)
            .click('#nextSection')
            .pause(500)
            .moveToElement('#nextSection', 10, 10)
            .click('#nextSection')
            .pause(1000)
            .moveToElement('.btn-primary', 10, 10)
            .click('.btn-primary')
            .pause(1000);
        browser.useXpath().expect.element("//*[contains(text(), 'Test Kurs')]").text.to.contain('Test Kurs').before(10000);
    },
    'Delete Course': function (browser) {
        browser.useXpath().expect.element("//*[contains(text(), 'Test Kurs')]").text.to.contain('Test Kurs').before(10000);
        browser.useXpath().click("//*[contains(text(), 'Test Kurs')]");
        browser.useCss().expect.element('#main-content > div.dropdown-course > a > h4').text.to.contain('Test Kurs').before(10000);
        browser.useCss().expect.element('#main-content > div.row.description > div > p').text.to.contain('Test Beschreibung').before(10000);
        browser.useCss()
            .waitForElementVisible('.btn-course-dropdown', 1000)
            .click('.btn-course-dropdown')
            .waitForElementVisible('.btn-course-edit', 1000)
            .click('.btn-course-edit')
            .waitForElementVisible('.btn-delete-course', 1000)
            .click('.btn-delete-course')
            .waitForElementVisible('.delete-modal', 1000)
            .waitForElementVisible('.delete-modal.in .btn-submit', 1000)
            .click('.delete-modal.in .btn-submit')
            .pause(1000);
    },
    'Schul-Cloud End': function (browser) {
        browser.end();
    }
};
