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
    'Create News': function (browser) {
        browser.url(base_url + 'news/');
        browser.expect.element('h4').text.to.contain('Neuigkeiten').before(10000);
        browser
            .click('.create')
            .pause(1000)
            .setValue('input[name=title]', 'Test News')
            .execute(
                function () {
                    CKEDITOR.instances["content"].setData('Lorem Ipsum');
                }
            )
            .moveToElement('.btn-submit', 10, 10)
            .click('.btn-submit')
            .pause(1000);
        browser.useXpath().expect.element("//*[contains(text(), 'Lorem Ipsum')]").text.to.contain('Lorem Ipsum').before(10000);
    },
    'Delete News': function (browser) {
        browser.useXpath().click("//*[contains(text(), 'Test News')]");
        browser.useCss()
            .click('.btn-delete')
            .waitForElementVisible('.delete-modal')
            .waitForElementVisible('.delete-modal .btn-submit', 1000)
            .click('.delete-modal .btn-submit')
            .pause(1000);
    },
    'Schul-Cloud End': function (browser) {
        browser.end();
    }
};
